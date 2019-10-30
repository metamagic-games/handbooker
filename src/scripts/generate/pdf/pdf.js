import * as htmlPdfChrome from "html-pdf-chrome";
import fs from "fs";
import generateHtml from "../html";

// ---------------------------------

const height = 282 
const width = 216

const stylesheets = {
  "dnd": "./node_modules/handbooker/lib/styles/homebrewery-styles.css",
};

const elementDimensions = {
  "page": {
    "height": height,
    "width": width,
    "padding": 5,
  },
  "card": {
    "height": 82,
    "width": 59,
    "margin": 2,
    "border": 1,
  }
}

const defaultPdfOptions = {
  "printOptions": {
    "displayHeaderFooter": false,
    marginTop: 0,
    marginRight: 0,
    marginLeft: 0,
    marginBottom: 0,
    // marginTop: elementDimensions.page.margin,
    // marginRight: elementDimensions.page.margin,
    // marginLeft: elementDimensions.page.margin,
    // marginBottom: elementDimensions.page.margin,
  },
};

const defaultMarkdownOptions = {
  "encoding": "utf8",
};

// ---------------------------------

const generatePdf = async ( target, destination="./output.pdf", options, ) => {
  console.log('Starting...')
  
  console.log("Options:", options);

  const style = options.customStyles 
    ? options.customStyles 
    : ( stylesheets[options.style] || stylesheets.dnd );

  const markdownOptions = ( options.markdownOptions || defaultMarkdownOptions )

  const html = await generateHtml( target, style, markdownOptions );

  if (options.debug) {
    console.log("Saving interim HTML...");

    fs.writeFile("debug.html", html, function(err) {
      if (err) console.log(err);
    });
  }

  console.log("Creating PDF...");

  const printOptions = options.pdfOptions || defaultPdfOptions

  return htmlPdfChrome
    .create(
      html, 
      printOptions,
    )
    .then((newPdf) => newPdf.toFile(destination))
    .then(_=>console.log(`${destination} generated`))
};

export default generatePdf;
