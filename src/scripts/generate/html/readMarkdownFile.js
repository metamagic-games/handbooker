import Markdown from "marked";
import fs from "fs";

const renderer = new Markdown.Renderer();

//Processes the markdown within an HTML block if it's just a class-wrapper
renderer.html = (html) => {
  if (_.startsWith(_.trim(html), "<div") && _.endsWith(_.trim(html), "</div>")) {
    const openTag = html.substring(0, html.indexOf(">") + 1);

    html = html.substring(html.indexOf(">") + 1);

    html = html.substring(0, html.lastIndexOf("</div>"));

    return `${ openTag } ${ Markdown(html) } </div>`;
  }

  return html;
};

const readMarkdownFile = (target, markdownOptions) => {
  console.log("Markdown options:", markdownOptions);

  return Markdown(
    fs.readFileSync(
      target, 
      markdownOptions.encoding
    ), 
    { renderer: renderer, }
  )
}

export default readMarkdownFile