# handbooker

Turn markdown into a Player's Handbook-style document. 

Based on [Homebrewery](https://github.com/stolksdorf/homebrewery)'s stylesheet.

---

## Usage

```
  const { handbooker, } = require("handbooker");
  
  const target = "./rulebook.md";
  
  const destination = "./rulebook.pdf";

  const options = {
    "debug": true,
    "style": "./node_modules/handbooker/lib/styles/homebrewery-styles.css",
    "printOptions": {
      displayHeaderFooter: false,
    },
  };

  handbooker( target, destination, options);
```
