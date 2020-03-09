import fs from "fs";

const readStylesheet = (styleOptions) => {
  console.log("Stylesheet:", styleOptions);
  return fs.readFileSync(styleOptions, function(err) { if (err) console.log(err); });
}

export default readStylesheet