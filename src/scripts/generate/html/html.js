import  _ from "lodash";
import  Markdown from "marked";
import fs from "fs";

// ---------------------------------------

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

// ---------------------------------------

const parseHtml = ( target, markdownOptions, ) => {
	return Markdown(
		fs.readFileSync(
			target, 
			markdownOptions.encoding
		), 
		{ renderer: renderer, }
	)
		.split("\\page")
		.map(( page,  pageCount) => {
			return `<div class="phb" id = "p${ pageCount + 1 }">${ page }</div>`;
		})
		.join(" ");
};

const generateHtml = (target, style, markdownOptions, ) => {
	const html = Array.isArray(target) 
		? target.map( path => parseHtml( path, markdownOptions, ) ).join(" ") 
		: parseHtml( target, markdownOptions, );

	const css = fs.readFileSync(style, function(err) { if (err) console.log(err); });

	return `
		<html>
			<head>
				<style>
					${ css }
				</style>
			</head>
			
			<body class = "document">
				<div class = "pages">
					${ html }
				</div>
			</body>
		</html>
	`;
};

export default generateHtml