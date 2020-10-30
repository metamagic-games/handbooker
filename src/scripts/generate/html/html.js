import _ from "lodash";
import fs from "fs";

import readStylesheet from "./readStylesheet";
import readMarkdownFile from "./readMarkdownFile";
import createHtmlPages from "./createHtmlPages";

const STYLESHEETS = {
  dnd: "./node_modules/handbooker/lib/styles/homebrewery-styles.css",
};

const MARKDOWN_OPTIONS_DEFAULT = {
  encoding: "utf8",
};

const writeDebugHTML = (html) => {
  console.log("Saving interim HTML...");

  fs.writeFile("debug.html", html, function (err) {
    if (err) console.log(err);
  });
};

const handleTargetPages = (targets, markdownOptions) => {
  if (Array.isArray(targets)) {
    return createHtmlPages(
      targets.map((path) => readMarkdownFile(path, markdownOptions)).join(" ")
    );
  }

  return createHtmlPages(readMarkdownFile(targets, markdownOptions));
};

const buildHtml = (css, html) =>
  `
		<html>
			<head>
				<style>
					${css}
				</style>
			</head>
			
			<body class="document">
				<div class="pages">
					${html}
				</div>
			</body>
		</html>
	`;

const generateHtml = (targets, options = {}) => {
  console.log("Generating HTML...");

  const styleOptions = options.customStyles
    ? options.customStyles
    : STYLESHEETS[options.style] || STYLESHEETS.dnd;

  const markdownOptions = options.markdownOptions || MARKDOWN_OPTIONS_DEFAULT;

  const html = handleTargetPages(targets, markdownOptions);

  const css = readStylesheet(styleOptions);

  if (options.debug) writeDebugHTML(buildHtml(css, html));

  return buildHtml(css, html);
};

export default generateHtml;
