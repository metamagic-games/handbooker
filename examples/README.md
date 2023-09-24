# handbooker-sample-project

With this sample project you can generate Player's Handbook-style documents from Markdown, using [Handbooker](https://github.com/metamagic-games/handbooker).

## Getting started

1. Clone this repo
2. Edit and rename `example-document.md`, or add your own markdown document
3. Change create the `target` and `destination` paths in `createRulebooks.js` (if necessary)
4. `npm install`
5. `npm run build`

## Why not just use [Homebrewery](http://homebrewery.naturalcrit.com/)?

Homebrewery is a fantastic tool, and this project wouldn't be possible without their fantastic stylesheet. However, Homebrewery doesn't make collaboration and tracking changes to your document easy. If you're just working alone, and you're not used to working with git, npm, or Markdown, this might not be the tool for you.

## Combining multiple markdown files

Handbooker allows you to combine multiple Markdown files into a single PDF. Simply pass in an ordered array of paths, as below:

```
    const target = [ "./example-document.md", "./example-document.md", ];
```

## Contributing

If you'd like to contribute, please fork the repository and use a feature branch. Pull requests are welcome!