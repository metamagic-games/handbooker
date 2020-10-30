import * as htmlPdfChrome from "html-pdf-chrome";
import generateHtml from "../html";

const HEIGHT = 282;
const WIDTH = 216;

const stylesheets = {
  dnd: "./node_modules/handbooker/lib/styles/homebrewery-styles.css",
};

const elementDimensions = {
  page: {
    height: HEIGHT,
    width: WIDTH,
    padding: 5,
  },
  card: {
    height: 82,
    width: 59,
    margin: 2,
    border: 1,
  },
};

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

const generatePdf = async (targets, destination = "./output.pdf", options) => {
  console.log("Starting PDF generation...");

  const html = await generateHtml(targets, options);

  console.log("Creating PDF...");

  const printOptions = options.pdfOptions || defaultPdfOptions;

  console.log("Print options:", printOptions);

  return htmlPdfChrome
    .create(html, printOptions)
    .then((newPdf) => newPdf.toFile(destination))
    .then((_) => console.log(`${destination} generated`));
};

export default generatePdf;
