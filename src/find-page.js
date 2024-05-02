/**
 * Page Lookup Service:
 * This wraps the 11ty all pages collection providing two methods for finding pages.
 *
 * @param {Array<any>} allPages
 * @param {import('@photogabble/eleventy-plugin-interlinker').SlugifyFn} slugifyFn
 * @return {import('@photogabble/eleventy-plugin-interlinker').PageDirectoryService}
 */
const pageLookup = (allPages = [], slugifyFn) => {
  return {
    findByLink: (link) => allPages.find((page) => {
      if (link.href && (page.url === link.href || page.url === `${link.href}/`)) {
        return true;
      }

      if (page.fileSlug === link.slug || (page.data.title && slugifyFn(page.data.title) === link.slug)) {
        return true;
      }

      // TODO: need a way to identify that wikilink is pointing to an alias, because the alias then becomes the link title

      const aliases = ((page.data.aliases && Array.isArray(page.data.aliases)) ? page.data.aliases : []).reduce(function (set, alias) {
        set.add(slugifyFn(alias));
        return set;
      }, new Set());

      return aliases.has(link.slug);
    }),

    findByFile: (file) => allPages.find((page) => page.url === file.page.url),
  }
}

module.exports = {
  pageLookup
}
