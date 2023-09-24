import { handbooker, } from "handbooker";

const options = {
	debug: true,
	printOptions: {
		displayHeaderFooter: false,
	},
};

const target = "./example-document.md";

const destination = "./example-document.pdf";

handbooker( target, destination, options, );
