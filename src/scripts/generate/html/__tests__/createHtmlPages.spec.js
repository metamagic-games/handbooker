import createHtmlPages from '../createHtmlPages'

const MARKDOWN_SAMPLE = `
  # Hello World

  This is some _markdown_.

  __FOR REAL!__
`

const MARKDOWN_AS_HTML = `<div class=\"phb\" id = \"p1\">
  # Hello World

  This is some _markdown_.

  __FOR REAL!__
</div>`

describe("createHtmlPages", () => {
  it("generates correct html", () => {
    expect(createHtmlPages(MARKDOWN_SAMPLE)).toBe(MARKDOWN_AS_HTML);
  });
});