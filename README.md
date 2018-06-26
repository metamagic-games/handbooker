# handbooker

[![npm version](https://badge.fury.io/js/handbooker.svg)](https://badge.fury.io/js/handbooker)

Turn markdown into a Player's Handbook-style document. 

Based on [Homebrewery](https://github.com/stolksdorf/homebrewery)'s stylesheet.

---

## Usage

For a working example, take a look at <https://github.com/paragon-games/handbooker-sample-project>

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

## Combining multiple markdown files

To merge many different Markdown files, simply replace:
```
    const target = "./rulebook.md";
```

With:
```
    const target = [ "./rulebook.md", "./rulebook2.md", ];
```

---

## Why not just use [Homebrewery](http://homebrewery.naturalcrit.com/)?

Homebrewery is a fantastic tool, and this project wouldn't be possible without their fantastic stylesheet. However, Homebrewery doesn't make collaboration and tracking changes to your document easy. If you're just working alone, and you're not used to working with git, npm, or Markdown, this might not be the tool for you.
