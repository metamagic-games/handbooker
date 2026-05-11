# Handbooker — Senior code review

**Reviewer's stance:** Just onboarded. The library is small (~150 lines of source), but punches above its weight in subtle bugs, dead code, and broken-by-design defaults. None of this is irretrievable — that's the good news for the team. The bad news is most of these issues should have been caught by the test suite if there were one, by types if any existed, or by reading the README and trying the example.

This review is intentionally exhaustive and opinionated. It is sorted roughly by impact: **critical → high → medium → low / hygiene**. Each item names the file and line, explains _why_ it's wrong (not just _what_ to change), and — where useful — calls out the engineering principle so juniors can generalize.

---

## TL;DR — the five things that would block sign-off

1. `pdf.js:49` reads `options.pdfOptions`, but every caller (README, `examples/`) passes `options.printOptions`. **The user's print configuration is silently discarded on every run.**
2. `package.json:62-64` declares Husky 4-style config under a Husky 7 dependency. **No pre-commit hook is actually running.** Format + build never execute on commit.
3. The hardcoded stylesheet path `./node_modules/handbooker/lib/styles/...` (in `pdf.js:8` and `html.js:8`) only works when run from the consumer project root, and only when this package is consumed via npm. **It cannot find its own styles when tested in-repo, in a monorepo, or from any subdirectory.**
4. `readStylesheet.js:5` calls `fs.readFileSync(path, callback)`. `readFileSync` does not accept a callback — it takes options. The "error handler" is dead code; on failure the call throws synchronously, uncaught.
5. The tests are almost theatrical: one passing test that asserts `<div>` wrapping (not even Markdown rendering), one `describe.skip` block with a typo in its import path that would fail to compile if anyone re-enabled it. There is **no meaningful test coverage** of the pipeline.

---

## 1. Critical — correctness bugs in the happy path

### 1.1 `printOptions` is ignored entirely

**File:** `src/scripts/generate/pdf/pdf.js:49`

```js
const printOptions = options.pdfOptions || defaultPdfOptions;
```

The README, the example project, _and the default options object in this very file_ all use the key `printOptions`. Nowhere in the documented surface is `pdfOptions` a real key. Any user who follows the documented example silently gets the defaults — including `displayHeaderFooter: false` even if they asked for `true`.

**Why this is bad engineering:** the bug is a single character but it survived because:

- No integration test ever asserted "the option I passed reached Chrome's print API."
- TypeScript would have caught this in five seconds with an `Options` interface.
- Manual smoke-testing alone is a poor substitute for a contract test on a configuration boundary.

**Even after the rename, this line is still wrong:** `options.printOptions || defaultPdfOptions` _replaces_ defaults instead of merging them. A user who sets only `landscape: true` would lose `printBackground`, `marginTop: 0`, etc. Use `{ ...defaultPdfOptions.printOptions, ...(options.printOptions ?? {}) }`.

**Principle:** for option bags, _merge_ — don't _replace_ — unless you've consciously decided defaults are all-or-nothing.

### 1.2 Stylesheet path is unfindable in most environments

**Files:** `src/scripts/generate/html/html.js:8`, `src/scripts/generate/pdf/pdf.js:8`

```js
const STYLESHEETS = {
  dnd: "./node_modules/handbooker/lib/styles/homebrewery-styles.css",
};
```

This is a relative path resolved against `process.cwd()` of the consuming process. It assumes:

- The consumer always runs from their project root.
- The consumer always installs from npm under that exact path.
- The package is _never_ tested locally (because in this repo the path would need to be `./lib/styles/...`).
- No monorepo, no pnpm hoisting, no Yarn PnP.

**Fix:** resolve relative to the package itself using `path.join(__dirname, "../../../styles/...")` or `require.resolve`. Never use cwd-relative paths for package internals.

**Principle:** a library should never assume _where its consumer is standing_. Anchor internal paths to the module, not to the process.

### 1.3 `fs.readFileSync` called with a callback

**File:** `src/scripts/generate/html/readStylesheet.js:3-9`

```js
const readStylesheet = (styleOptions) => {
  console.log("Stylesheet:", styleOptions);
  return fs.readFileSync(styleOptions, function (err) {
    if (err) console.log(err);
  });
};
```

`readFileSync` has signature `(path, options)`. The second argument here is the _options_ object — a function gets stringly-coerced and silently ignored. Consequences:

- No encoding is set → returns a `Buffer`, not a `string`. It happens to coerce to a string when embedded into the HTML template, but you've lost any control over encoding.
- The "error callback" never fires. A missing file throws synchronously and uncaught — no log line, the process dies on stack trace.

This is a copy-paste of the async API form into a sync call site. It's not a behavior bug _yet_ (it works on disk), but it's a latent crash and a misleading lie about error handling. Either pass `"utf8"` and remove the callback, or switch to `fs.readFileSync(path, "utf8")` and wrap call sites in `try/catch` at a boundary.

### 1.4 `\page` splitting is naive

**File:** `src/scripts/generate/html/createHtmlPages.js:3`

```js
return markdown.split("\\page")...
```

Splitting on the literal string `\page` (the `\\` in source is just an escaped backslash) means:

- A `\page` inside a fenced code block becomes a page break.
- A `\pageref` or `\pagebreak` in user content would (partially) match and slice.
- There is no way to escape it.
- A trailing `\page` produces an empty terminal page div.
- A document with zero `\page` markers still gets one `<div class="phb">`, which may not match user expectations of "no pages defined."

A markdown-aware tokenizer (or at minimum a regex that respects line boundaries: `/^\\page\s*$/m`) is the right tool. Currently we hand the user a footgun and don't even document its shape.

### 1.5 Multi-file concatenation corrupts Markdown

**File:** `src/scripts/generate/html/html.js:23-31`

```js
return createHtmlPages(
  targets.map((path) => readMarkdownFile(path, markdownOptions)).join(" "),
);
```

Two issues:

1. `readMarkdownFile` runs `marked()` on each file _before_ joining. So by this point each entry is already HTML, not Markdown. Joining HTML strings with `" "` (space) loses block structure between files (e.g., end of file A's `<p>` butts directly against the start of file B's `<h1>` with a single space between them — fine for the browser, but the _concept_ of "concatenating markdown files" has been lost).
2. The page-split happens on the _concatenated HTML_. Since `marked` will not preserve `\page` literally if the file content used it (backslash-handling depends on context), page breaks across file boundaries don't behave as a naïve user would expect.

The README documents the multi-target feature in two sentences and never warns the user about either of these footguns. Decide a contract: are we concatenating markdown sources, or rendering each separately and stitching the resulting HTML? Currently we do an unprincipled mix.

### 1.6 Argument order is a footgun

**File:** `src/scripts/generate/pdf/pdf.js:42`

```js
const generatePdf = async (targets, destination = "./output.pdf", options) => {
```

`options` is the _third_ parameter and has no default. A user calling `handbooker(target, options)` thinking "I'll let it default the destination" will:

- bind `options` to `destination` (silently writing PDF to whatever string they passed, or crashing on `.toFile` with a non-string),
- get `undefined` for `options`,
- crash on `options.pdfOptions` at line 49.

Either reorder (`targets, options, destination?`) or accept an options object as the second arg. Also: `options = {}` default. Defending the entry point of a library against "user passed something dumb" is part of the contract.

### 1.7 Husky hooks are not running

**File:** `package.json:62-66`

```json
"husky": {
  "hooks": {
    "pre-commit": "npm run format:staged && npm run build"
  }
}
```

This is Husky 4 syntax. The project depends on `"husky": "^7.0.0"`, which uses a `.husky/` directory with executable shell scripts. The current config is **dead JSON**. No pre-commit hook fires. The codebase shows the symptoms — uncommitted formatting drift, no enforcement of `npm run build` before pushing.

Either migrate to Husky 7 (`npx husky-init`, commit `.husky/pre-commit`) or downgrade to `husky@^4`. The current state is the worst of both worlds: appears configured, isn't.

**Principle:** lifecycle automation is invisible when it works and invisible when it doesn't. Test that it fires (e.g., a commit that should be rejected).

---

## 2. High — broken or absent tests

### 2.1 The only "real" test asserts almost nothing

**File:** `src/scripts/generate/html/__tests__/createHtmlPages.spec.js`

The test feeds a markdown string with **no `\page` markers** and checks that the output is `<div class="phb" id="p1">…</div>`. It exercises:

- the wrapping div,
- the page counter at position 1,

and **nothing else.** It does _not_ test:

- multi-page splitting,
- trailing `\page`,
- leading `\page`,
- `\page` inside code blocks (the most obvious edge case for a thing called Handbooker),
- empty input,
- non-string input.

This is the classic "test was written to make the line green, not to verify behavior." If your goal as a junior is to internalize one thing from this review: **write the test against the spec, not against the implementation.**

### 2.2 The other test is `describe.skip` with a broken import

**File:** `src/scripts/generate/html/__tests__/readMarkdownFile.spec.js`

```js
import markdown from "mardown.md"; // typo: should be "./markdown.md"
...
describe.skip("readMarkdownFile", () => {
  it("generates correct html", () => {
    expect(readMarkdownFile(markdown, MARKDOWN_OPTIONS_DEFAULT)).toBe(
      MARKDOWN_AS_HTML // not defined anywhere
    );
  });
});
```

If anyone un-skips this, it will fail to even resolve, because:

- `mardown.md` doesn't exist,
- `MARKDOWN_AS_HTML` is undeclared.

`describe.skip` is a TODO that lives in green CI runs forever. Either delete it, fix it, or convert to a `test.todo("readMarkdownFile end-to-end")` so it shows up as a real unfinished task.

### 2.3 No tests for `html.js`, `pdf.js`, `readStylesheet.js`

The two highest-fanout functions in the codebase have no tests. The integration boundary (markdown → HTML → PDF) has no smoke test. CI runs `npm test` and reports green based on the trivial wrapper test above.

**A bare minimum for this codebase:**

- A `generateHtml(["./fixtures/a.md", "./fixtures/b.md"])` test that asserts the produced HTML contains both inputs and respects `\page` splits.
- A `generatePdf` test that mocks `html-pdf-chrome` and asserts the _merged_ `printOptions` are passed through.
- A failure-path test for missing files and unknown styles.

---

## 3. High — fragile rendering and parsing

### 3.1 `renderer.html` is brittle and partially-recursive

**File:** `src/scripts/generate/html/readMarkdownFile.js:7-23`

```js
renderer.html = (html) => {
  if (
    _.startsWith(_.trim(html), "<div") &&
    _.endsWith(_.trim(html), "</div>")
  ) {
    const openTag = html.substring(0, html.indexOf(">") + 1);
    html = html.substring(html.indexOf(">") + 1);
    html = html.substring(0, html.lastIndexOf("</div>"));
    return `${openTag} ${Markdown(html)} </div>`;
  }
  return html;
};
```

Issues, in increasing severity:

1. **Tag detection is string-based, not tag-based.** `<div` matches `<divider>`, `<diversion>`, `<dives>`. (`marked` is unlikely to emit those, but the principle is wrong.)
2. **Operates on different strings.** The `startsWith`/`endsWith` checks use `_.trim(html)`, but `indexOf(">")` and `lastIndexOf("</div>")` operate on the _un-trimmed_ original. If the input has leading whitespace, the open-tag extraction is off.
3. **`indexOf(">")` is naive.** Any attribute containing `>` (rare but possible in HTML5 unquoted attrs, or inside nested tag soup) breaks tag boundary detection.
4. **Recursion is asymmetric.** Inner content is rendered with `Markdown(html)` _without passing the custom renderer_. So a nested wrapper-div does not get the same treatment.
5. **Loses attributes on the closing tag.** Not a real bug (closing tags can't have attributes), but the manual reconstruction means any whitespace before `</div>` that mattered to a CSS adjacent-selector is gone.

If the goal is "let me write `<div class="note">` in my markdown and have the contents parsed as markdown," this should be a real mini-parser or — better — implemented via a marked extension or remark plugin. The current code is ~15 lines of subtle string-slicing with no tests.

### 3.2 Lodash for string primitives

Same file uses `_.startsWith`, `_.endsWith`, `_.trim` — all native on `String.prototype` since ES2015. Lodash is in the deps tree purely for this. Drop it.

### 3.3 `marked` is pinned to 2.x — EOL

`marked` 2.x last released 2021 and has no security maintenance. `marked` 16 is current. Upgrading will require touching `Markdown.Renderer` (now `marked.Renderer` with different async semantics) and the `renderer.html` hook signature. Not trivial, but not optional either.

### 3.4 CSS embedded directly into HTML — `</style>` injection

**File:** `src/scripts/generate/html/html.js:33-48`

The CSS file is interpolated into a `<style>...</style>` block. If any stylesheet ever contains the literal string `</style>` (in a comment, a `content:` rule, or a user's custom stylesheet), the browser closes the style block early and renders the rest of your CSS as document content. For the bundled stylesheet this is unlikely, but `customStyles` is a user-supplied file. Either escape `</style>` to `<\/style>` or link the stylesheet rather than inline it.

### 3.5 SCSS and CSS coexist with no build pipeline

**Files:** `src/styles/homebrewery-styles.css` (668 lines) and `src/styles/homebrewery-styles.scss` (749 lines)

There is no script that compiles one into the other. They have drifted (different line counts). Which is canonical? At publish time, `build` copies `src/styles/*` to `lib/styles/*`, shipping both. Pick one source of truth.

---

## 4. Medium — API design and ergonomics

### 4.1 Library is chatty by default

Every call to `generatePdf` emits five `console.log` lines, plus an `fs.writeFile` to `debug.html` if `debug: true`. A library should not log unless asked. Wrap behind a `verbose` option, or use `debug` (the npm package) namespaced to `handbooker:*`. Right now, calling this from another tool pollutes its stdout.

### 4.2 `debug.html` is racy and hardcoded

**File:** `src/scripts/generate/html/html.js:15-21`

```js
fs.writeFile(debugPath, html, (err) => {
  if (err) console.log(err);
});
```

- Path is `debug.html` in `cwd`, not configurable.
- `writeFile` is async and not awaited; PDF generation may complete (and the process exit) before the file is fully written.
- Error handling is `console.log` — not even `console.error`.

Either await it (`fs.promises.writeFile`) or use `writeFileSync` since we're already pretending to be synchronous everywhere else.

### 4.3 Stylesheet is re-read on every call

Minor, but `readStylesheet` is invoked once per `generateHtml` call. For a long-running renderer (e.g., a watch mode), cache it. The bigger issue is that re-reading hides the lack of a sane error path: a permission error mid-run looks identical to a permission error on first run.

### 4.4 `generatePdf` mixes `async`/`await` with `.then(...).then(...)`

**File:** `src/scripts/generate/pdf/pdf.js:53-56`

```js
return htmlPdfChrome
  .create(html, printOptions)
  .then((newPdf) => newPdf.toFile(destination))
  .then((_) => console.log(`${destination} generated`));
```

- The returned promise resolves to `undefined` (the second `.then` discards the result). Callers can't get the saved path.
- Mixing styles makes error handling inconsistent: an `await` would let you `try/catch`; the `.then` chain swallows nothing but offers nothing.
- `(_)` is throwaway-arg ceremony for what should be `() =>`.

Replace with:

```js
const pdf = await htmlPdfChrome.create(html, printOptions);
await pdf.toFile(destination);
return destination;
```

### 4.5 No input validation at the boundary

- `targets` is never checked for being a `string | string[]`. Pass a number → crash deep inside `fs`.
- `destination` is never checked. Pass an array → crash in `toFile`.
- Unknown `options.style` falls back to `dnd` silently. Should at least warn.
- `customStyles` path is not validated for existence; failure happens deep inside `readStylesheet`.

**Principle:** validate at the boundary, trust internally. The boundary is `generatePdf`. Today we trust everywhere and fail deep.

### 4.6 No TypeScript / no `.d.ts`

This is a public npm package. Consumers get zero types. Either migrate or hand-write a `.d.ts` and ship it. The options bag is exactly the surface area types pay for.

### 4.7 Default destination encourages collisions

`destination = "./output.pdf"` in cwd. Two consumer scripts in the same directory clobber each other silently. Either require it, or namespace it (e.g., to a temp dir).

---

## 5. Medium — packaging, CI, tooling

### 5.1 `"fs": "0.0.1-security"` in dependencies

**File:** `package.json:36`

This is the npm placeholder squat package for the `fs` name. Node ships `fs` as a builtin. Listing it does _nothing useful_ — Node's resolver picks the builtin first — but it pollutes the dependency tree and shows up in audits. Remove.

### 5.2 License mismatch

`package.json:21` says `"license": "ISC"`. `LICENSE.md` is the MIT License text. Pick one and align both. (npm registries surface the `package.json` field; GitHub surfaces the `LICENSE` file. Today they disagree.)

### 5.3 No `engines` field

The code uses optional chaining nowhere but relies on Node ≥ 10-ish for various behaviors. CircleCI pins Node 12.6.0 (EOL since April 2022). Declare `"engines": { "node": ">=18" }` (or whatever you support) so npm warns consumers and CI fails fast.

### 5.4 CI is non-deterministic and uses EOL Node

**File:** `.circleci/config.yml`

- `circleci/node:12.6.0` — Node 12 is EOL. Switch to `cimg/node:lts`.
- `npm install` — non-deterministic; uses `package.json` ranges. Use `npm ci` so the lockfile is authoritative.
- Cache key uses `checksum "package.json"` instead of `checksum "package-lock.json"`. A range bump that doesn't touch `package.json` reuses a stale cache.
- No lint step. No type check (n/a today). No `npm audit`. No build verification — `lib/` is only built locally (or supposed to be, via the broken Husky hook), and CI never checks it compiles.

### 5.5 `prepublishOnly` is missing

`npm publish` will ship whatever `lib/` happens to be on disk. If a maintainer forgets to `npm run build`, they publish stale code. Add:

```json
"prepublishOnly": "npm run build"
```

### 5.6 `scripts.build` uses `./node_modules/.bin/babel`

Brittle and Windows-hostile. npm scripts add `node_modules/.bin` to `PATH` already — just say `babel`.

### 5.7 `package-lock.json` is ~530KB

Not abnormal, but worth a once-over. There's no Dependabot config in the repo (recent commits show Dependabot bumps, so it's configured at the GH org/repo level). Confirm it's enabled and that PRs run CI before auto-merge.

### 5.8 `__mocks__/file-mock.js` has no trailing newline

Trivial, but it's the kind of thing your editor/formatter should be enforcing — and would be if the pre-commit hook ran.

---

## 6. Low — documentation drift

- README option example uses `style: "dnd"` and `customStyles: "..."` but doesn't say what path semantics `customStyles` follows (relative to what?).
- README claims "several different games" are supported; only one (`dnd`) is wired up. The fallback silently masks the missing entries.
- `src/scripts/generate/pdf/README.md` is half copy-pasted from Chrome's headless docs with broken markdown formatting (`### ds` appears five times — looks like a copy-paste editing accident).
- `package.json` description: `"Turn markdown into a players handbook"` — missing apostrophe; the GitHub README is correct. Pick one.
- No CHANGELOG. With a `1.6.6` semver, that's increasingly costly.

---

## 7. Edge cases the team probably hasn't considered

Treat these as a starter test plan. Each line is at least one test case.

### Input handling

- Empty markdown file (zero bytes).
- Markdown file with only whitespace.
- Markdown file with only a `\page` marker.
- Markdown file ending in `\page` (does the trailing empty page render?).
- Markdown file containing `\page` inside a fenced code block — should _not_ page-break.
- Markdown file containing `\page` mid-paragraph.
- Markdown file with BOM (UTF-8 byte-order mark).
- Markdown file in UTF-16 / latin-1 — current code requests UTF-8 but doesn't validate.
- `targets = []` (empty array).
- `targets = ["./a.md", "./a.md"]` (duplicates — page IDs collide implicitly because they renumber globally).
- `targets` containing a path that doesn't exist — currently a stack trace.
- `targets` containing a directory path — currently a stack trace from `readFileSync`.
- `targets` containing a symlink — should follow; does it?
- Mixed array of strings and non-strings.
- A 50MB markdown file — synchronous read blocks the event loop indefinitely.

### Multi-file specifics

- Two files where each contains its own `\page` — does cross-file pagination behave sanely?
- File A ends mid-list (e.g., `- item`) and file B starts with `- item2` — joined by a single space, the list semantics break.
- File A ends with `# Header` and file B starts with `text` — same issue.
- Markdown reference-style links (`[foo][1]`) defined in one file but used in another — currently broken because each file is parsed independently.

### Output handling

- `destination` already exists — silently overwritten.
- `destination` path's directory doesn't exist — `toFile` will throw deep inside `html-pdf-chrome`.
- `destination` on a read-only filesystem.
- `destination` is a directory.
- Concurrent calls writing to the same `destination`.
- The default `./output.pdf` colliding across concurrent invocations.

### Styling

- `options.customStyles` points to a missing file — synchronous throw, no user-friendly message.
- `options.customStyles` is a relative path — relative to what? (cwd today; not documented).
- `options.style` is a typo (`"dnd5"`) — silently falls back to `dnd`.
- `options.style` is `null` — `STYLESHEETS[null]` is `undefined`, fallback fires. Probably fine, but it's accidental.
- Stylesheet contains `</style>` literal — breaks rendering (see 3.4).
- Stylesheet contains `${}` template syntax — not interpolated (because CSS is the value, not the template), but worth a test to lock in.

### HTML rendering

- A `<div>` with markdown content that itself contains `<div>...</div>` nested.
- A `<div>` with attributes containing `>` (e.g., `<div data-attr="a>b">`).
- A `<span>` block — not handled at all; falls through unchanged.
- A `<div>...</div><div>...</div>` on the same line — `lastIndexOf("</div>")` includes the inner one as content.
- Self-closing `<div/>` — passes the startsWith check but has no closing tag.

### PDF generation

- `html-pdf-chrome` requires a Chrome instance on `localhost:9222`. Not in CI, not documented, no error message that hints at this. ECONNREFUSED is the user's first experience.
- `printOptions.paperWidth`/`paperHeight` are commented out — the page dimensions in `pdf.js` are unused. Are they supposed to be applied?
- `displayHeaderFooter: false` is hardcoded into the default — if a user passes `headerTemplate` they probably expect it to display. Today they have to set both.

### Concurrency

- Calling `handbooker` twice in parallel: both write to `debug.html` if debug is on, both may race on `output.pdf` if destination is defaulted, the module-level `renderer` is shared singleton state.

---

## 8. Suggested order of operations

If I were rolling this forward as a tech lead, here's the sequence — small PRs, each independently mergeable:

1. **Add a smoke test** that runs `generateHtml` against a fixture with `\page` markers and asserts the page count, then run it in CI. This is the safety net for everything that follows.
2. **Fix `printOptions` vs `pdfOptions`** (1.1) and merge defaults instead of replacing.
3. **Fix the stylesheet path** (1.2) using `__dirname`-relative resolution.
4. **Fix `readStylesheet`** (1.3): `fs.readFileSync(path, "utf8")`, no callback, wrap call site in `try/catch`.
5. **Fix Husky 7 config** (1.7) — actually wire the hook so format + build run before commits.
6. **Bump CI** to a supported Node (5.4) and switch to `npm ci`.
7. **Remove the bogus `fs` dependency** (5.1).
8. **Reconcile licenses** (5.2).
9. **Decide CSS vs SCSS** (3.5).
10. **Plan a `marked` upgrade** (3.3) and use the upgrade as the moment to rewrite the brittle `renderer.html` (3.1) as a marked extension.
11. **Move to TypeScript or ship a `.d.ts`** (4.6). Many of the bugs above would not have survived a typed `Options` interface.

Each of these is small enough to do in an afternoon. Together they get the codebase to a place where a junior engineer can ship to it confidently.

---

## 9. Lessons for the team

Five things to internalize, in plain English:

1. **Default values should be merged, not replaced, when the user gives you partial input.** Otherwise the user pays for "I just want to change one thing" by losing all the things they didn't know they were getting.
2. **Tests assert the spec, not the implementation.** "Wraps in a div" is implementation. "Splits on `\page` and not on `\pagebreak`" is spec. Write the second kind.
3. **Anchor file paths to the module, never to the process.** The library cannot know where the consumer is standing.
4. **Validate at the boundary, trust inside.** A library has exactly one boundary worth defending: its public entry point. Crashes there with terrible stack traces are pure user pain.
5. **Lifecycle automation that you can't see is worse than no automation.** A "configured" hook that doesn't fire, a `describe.skip` that has rotted, a CI that uses outdated Node — all of these _look like_ engineering rigor while being its absence. Verify that your tools actually run.
