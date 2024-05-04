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
    findByLink: (link) => {
      let foundByAlias = false;
      const page = allPages.find((page) => {
        if (link.href && (page.url === link.href || page.url === `${link.href}/`)) {
          return true;
        }

        // TODO: is there a need to slug the page title for comparison? We can match on link.name === page.data.title!

        if (page.fileSlug === link.slug || (page.data.title && slugifyFn(page.data.title) === link.slug)) {
          return true;
        }

        // TODO: need a way to identify that wikilink is pointing to an alias, because the alias then becomes the link title

        const aliases = ((page.data.aliases && Array.isArray(page.data.aliases)) ? page.data.aliases : []).reduce(function (set, alias) {
          set.add(alias);
          return set;
        }, new Set());

        foundByAlias = aliases.has(link.name);
        return foundByAlias;
      });

      return {
        found: !!page,
        page,
        foundByAlias,
      }
    },

    findByFile: (file) => allPages.find((page) => page.url === file.page.url),
  }
}

module.exports = {
  pageLookup
}
