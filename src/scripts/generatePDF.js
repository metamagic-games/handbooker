import fs from "fs";
import * as htmlPdfChrome from "html-pdf-chrome";
import { generateHTML, } from "./generateHTML.js";

// ---------------------------------

const pdfOptions = {
	"printOptions": {
		displayHeaderFooter: false,
	},
};

const markdownOptions = {
	"encoding": "utf8",
};

const style = "../styles/homebrewery-styles.css";

// ---------------------------------

const generatePDF = ( target, destination, options, ) => {
	const html = generateHTML( target, ( options.style || style ), ( options.markdownOptions || markdownOptions ) );

	console.log("Options:", options);

	if (options.debug) {
		console.log("Saving interim HTML...");

		fs.writeFile("debug.html", html, function(err) {
			if (err) console.log(err);
		});
	}

	console.log("Creating PDF...");

	htmlPdfChrome.create(
		html, 
		( options.pdfOptions || pdfOptions )
	).then((newPdf) => newPdf.toFile(destination || "test.pdf"));
};

export default generatePDF;
