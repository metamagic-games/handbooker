import  _ from "lodash";
import fs from "fs";
import  Markdown from "marked";

const renderer = new Markdown.Renderer();

//Processes the markdown within an HTML block if it's just a class-wrapper
renderer.html = function(html) {
	if (_.startsWith(_.trim(html), "<div") && _.endsWith(_.trim(html), "</div>")) {
		const openTag = html.substring(0, html.indexOf(">") + 1);

		html = html.substring(html.indexOf(">") + 1);

		html = html.substring(0, html.lastIndexOf("</div>"));

		return `${ openTag } ${ Markdown(html) } </div>`;
	}

	return html;
};

const tagTypes = [ "div", "span", "a", ];

const tagRegex = new RegExp(
	`(${ _.map(tagTypes, (type) => {
		return `\\<${type }|\\</${type }>`;
	}).join("|") })`,
	"g"
);

export const parseHTML = (targetURL, style, markdownOptions) => {
	return `
		<html>
			<head>
				<style>
					${fs.readFileSync(style, function(err) {
		if (err) console.log(err);
	}) }
				</style>
			</head>
			
			<body class = "document">
				<div class = "pages">
					${
	Markdown(
		fs.readFileSync(
			targetURL, 
			markdownOptions.encoding
		), 
		{ renderer: renderer, }
	)
		.split("//page")
		.map((x, i) => {
			return `<div class="phb" id = "p${i + 1 }">${x }</div>`;
		})
		.join(" ")
}
				</div>
			</body>
		</html>
`;
};