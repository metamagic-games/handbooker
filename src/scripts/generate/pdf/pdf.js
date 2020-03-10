import * as htmlPdf from "html-pdf";
import fs from "fs";
import generateHtml from "../html";

// ---------------------------------

const HEIGHT = 282 
const WIDTH = 216

const stylesheets = {
  "dnd": "./node_modules/handbooker/lib/styles/homebrewery-styles.css",
};

const elementDimensions = {
  "page": {
    "height": HEIGHT,
    "width": WIDTH,
  },
}

const defaultPdfOptions = {
  printOptions: {
    displayHeaderFooter: false,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    printBackground: true,
    //paperHeight: HEIGHT,
    //paperWidth: WIDTH,
    // marginTop: elementDimensions.page.margin,
    // marginRight: elementDimensions.page.margin,
    // marginLeft: elementDimensions.page.margin,
    // marginBottom: elementDimensions.page.margin,
  },
};

const writeDebugHTML = (html) => {
  console.log("Saving interim HTML...");

  fs.writeFile("debug.html", html, function(err) {
    if (err) console.log(err);
  });
}

const generatePdf = async ( target, destination="./output.pdf", options, ) => {
  console.log('Starting PDF generation...')

  const html = await generateHtml( target, options );

  if (options.debug) {
    writeDebugHTML(html)
  }

  console.log("Creating PDF...");

  const printOptions = options.pdfOptions || defaultPdfOptions

  console.log("Print options:", printOptions);

  return htmlPdf
    .create(
      html, 
      printOptions,
    )
    .toFile(destination, (err, res) => {
      if (err) return console.log(err);
      console.log(`${res.filename} generated`)
    })
};

export default generatePdf;
