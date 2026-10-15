import readMarkdownFile from "../readMarkdownFile";
import { join } from "path";

const MARKDOWN_OPTIONS_DEFAULT = {
  encoding: "utf8",
};

describe("readMarkdownFile", () => {
  it("renders headings and inline formatting from a Markdown file", () => {
    const html = readMarkdownFile(
      join(__dirname, "markdown.md"),
      MARKDOWN_OPTIONS_DEFAULT,
    );
    const document = new DOMParser().parseFromString(html, "text/html");

    expect(document.querySelector("h1").textContent).toBe("Hello World");
    expect(document.querySelector("p em").textContent).toBe("markdown");
    expect(document.querySelector("p strong").textContent).toBe("FOR REAL!");
  });

  it("renders Markdown inside divs and preserves standalone HTML", () => {
    const html = readMarkdownFile(
      join(__dirname, "wrapped-markdown.md"),
      MARKDOWN_OPTIONS_DEFAULT,
    );
    const document = new DOMParser().parseFromString(html, "text/html");

    expect(document.querySelector(".note strong").textContent).toBe(
      "Important",
    );
    expect(document.querySelector("img").getAttribute("src")).toBe(
      "example.png",
    );
    expect(document.querySelector("img").getAttribute("alt")).toBe("Example");
  });
});
