const createHtmlPages = ( markdown ) => {
  return markdown
    .split("\\page")
    .map(( page,  pageCount) => {
      return `<div class="phb" id = "p${ pageCount + 1 }">${ page }</div>`;
    })
    .join(" ");
};

export default createHtmlPages