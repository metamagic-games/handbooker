import  _ from "lodash";

import readStylesheet from './readStylesheet'
import readMarkdownFile from './readMarkdownFile'
import createHtmlPages from './createHtmlPages'

const STYLESHEETS = {
  "dnd": "./node_modules/handbooker/lib/styles/homebrewery-styles.css",
};

const MARKDOWN_OPTIONS_DEFAULT = {
  "encoding": "utf8",
};

const generateHtml = (target, options={} ) => {
	console.log("Generating HTML...")

	const styleOptions = options.customStyles 
    ? options.customStyles 
    : ( STYLESHEETS[options.style] || STYLESHEETS.dnd );

  const markdownOptions = options.markdownOptions || MARKDOWN_OPTIONS_DEFAULT

	const html = Array.isArray(target) 
		? target.map(path => {
				return createHtmlPages(
					readMarkdownFile(path, markdownOptions)
				)
			})
				.join(" ") 
		: createHtmlPages(
			readMarkdownFile(target, markdownOptions)
		)

	const css = readStylesheet(styleOptions)

	return `
		<html>
			<head>
				<style>
					${ css }
				</style>
			</head>
			
			<body class="document">
				<div class="pages">
					${ html }
				</div>
			</body>
		</html>
	`;
};

export default generateHtml