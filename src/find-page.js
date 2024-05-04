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

        // Order of lookup:
        // 1. match file slug to link slug
        // 2. match file title to link identifier (name)
        // 3. match fle based upon alias

        if (page.fileSlug === link.slug || (page.data.title && page.data.title === link.name)) {
          return true;
        }

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
