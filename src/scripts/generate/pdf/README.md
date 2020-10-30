# PDF

## printOptions

### landscape

Paper orientation. Defaults to false.

`landscape?: boolean;`

### displayHeaderFooter

Display header and footer. Defaults to false.

`displayHeaderFooter?: boolean;`

- Print background graphics. Defaults to false.
  printBackground?: boolean;

### ds

- Scale of the webpage rendering. Defaults to 1.
  scale?: number;

### ds

- Paper width in inches. Defaults to 8.5 inches.
  paperWidth?: number;

### ds

- Paper height in inches. Defaults to 11 inches.
  paperHeight?: number;

### ds

- Top margin in inches. Defaults to 1cm (~0.4 inches).
  marginTop?: number;

### ds

- Bottom margin in inches. Defaults to 1cm (~0.4 inches).
  marginBottom?: number;

### ds

- Left margin in inches. Defaults to 1cm (~0.4 inches).
  marginLeft?: number;

### ds

- Right margin in inches. Defaults to 1cm (~0.4 inches).
  marginRight?: number;

### ds

- Paper ranges to print, e.g., '1-5, 8, 11-13'.
- Defaults to the empty string, which means print all pages.
  pageRanges?: string;

### ignoreInvalidPageRanges

- Whether to silently ignore invalid but successfully parsed
- page ranges, such as '3-2'. Defaults to false.
  ignoreInvalidPageRanges?: boolean;

### headerTemplate

- HTML template for the print header.
- Should be valid HTML markup with following classes used to inject printing values into them:
- - `date` formatted print date
- - `title` document title
- - `url` document location
- - `pageNumber` current page number
- - `totalPages` total pages in the document

*

- For example, `<span class="title"></span>` would generate a span containing the title.
  `headerTemplate?: string;`

### footerTemplate

HTML template for the print footer. Should use the same format as the `headerTemplate`.

`footerTemplate?: string;`

### preferCSSPageSize

Whether or not to prefer page size as defined by css.
Defaults to false, in which case the content will be scaled to fit the paper size.
`preferCSSPageSize?: boolean;`
