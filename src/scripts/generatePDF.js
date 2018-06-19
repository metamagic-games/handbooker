import fs from "fs";
import pdf from "html-pdf";
import { parseHTML, } from "./generateHTML.js";

const markdownOptions = {
	"encoding": "utf8",
};

const pdfOptions = {
	"format": "letter",
	"orientation": "portrait",
	"border": 0,
};

const generatePDF = ( target, destination, options, ) => {
	const html = parseHTML( target, options.style, ( options.markdownOptions || markdownOptions ) );

	console.log("Options:", options);

	if (options.debug) {
		console.log("Saving interim HTML...");

		fs.writeFile("debug.html", html, function(err) {
			if (err) console.log(err);
		});
	}

	console.log("Creating PDF...");

	pdf.create( html, ( options.pdfOptions || pdfOptions ) ).toFile( 
		destination,
		function(err) {
			if (err) return console.log(err);
		}
	);
};

export default generatePDF;
