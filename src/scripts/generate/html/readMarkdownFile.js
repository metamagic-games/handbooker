import { marked, Renderer } from "marked";
import fs from "fs";
import _ from "lodash";

const renderer = new Renderer();

renderer.html = ({ text }) => {
  const trimmed = _.trim(text);

  if (_.startsWith(trimmed, "<div") && _.endsWith(trimmed, "</div>")) {
    const openTag = text.substring(0, text.indexOf(">") + 1);
    let inner = text.substring(text.indexOf(">") + 1);
    inner = inner.substring(0, inner.lastIndexOf("</div>"));

    return `${openTag} ${marked.parse(inner)} </div>`;
  }

  return text;
};

const readMarkdownFile = (target, markdownOptions) => {
  console.log("Markdown options:", markdownOptions);

  return marked.parse(fs.readFileSync(target, markdownOptions.encoding), {
    renderer,
  });
};

export default readMarkdownFile;
