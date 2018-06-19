import fs from "fs";
import pdf from "html-pdf";
import generateHTML from "./generateHTML.js";

const markdownOptions = {
	encoding: "utf8"
};

const pdfOptions = {
	format: "letter",
	orientation: "portrait",
	border: 0,
	base: "../"
};

export default class generatePDF {
	createHandbook( options, ) {
		const html = generateHTML.parse("Hello world", options.target);

		if (options.debug) {
			console.log("Saving interim HTML...");

			fs.writeFile("debug.html", html, function(err) {
				if (err) console.log(err);
			});
		}

		console.log("Creating PDF...");

		pdf.create(html, pdfOptions).toFile( 
			options.destination,
			function(err) {
				if (err) return console.log(err);
			}
		);
	}
};
