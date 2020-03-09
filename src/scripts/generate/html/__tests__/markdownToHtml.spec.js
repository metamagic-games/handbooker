import markdownToHtml from '../markdownToHtml'

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

describe("markdownToHtml", () => {
  it("generates correct html", () => {
    expect(markdownToHtml(MARKDOWN_SAMPLE)).toBe(MARKDOWN_AS_HTML);
  });
});