import readMarkdownFile from '../readMarkdownFile'
import markdown from 'mardown.md'

const MARKDOWN_OPTIONS_DEFAULT = {
  "encoding": "utf8",
};

describe.skip("readMarkdownFile", () => {
  it("generates correct html", () => {
    expect(readMarkdownFile(markdown, MARKDOWN_OPTIONS_DEFAULT)).toBe(MARKDOWN_AS_HTML);
  });
});