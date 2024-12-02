/**
 * Page Lookup Service:
 * This wraps the 11ty all pages collection providing two methods for finding pages.
 *
 * @param {Array<any>} allPages
 * @return {import('@photogabble/eleventy-plugin-interlinker').PageDirectoryService}
 */
export const pageLookup = (allPages = []) => {
  return {
    findByLink: (link) => {
      let foundByAlias = false;
      const page = allPages.find((page) => {

        // Order of lookup:
        // 1. if is path link, return filePathStem match state
        // 2. match file url to link href
        // 3. match file slug to link slug
        // 4. match file title to link identifier (name)
        // 5. match file based upon alias

        if (link.isPath) {
          return page.filePathStem === link.name;
        }

        if (link.href && (page.url === link.href || page.url === `${link.href}/`)) {
          return true;
        }

        if ((page.data.title && page.data.title === link.name) || page.fileSlug === link.name ) {
          return true;
        }

        const aliases = ((page.data.aliases && Array.isArray(page.data.aliases))
            ? page.data.aliases
            : (typeof page.data.aliases === 'string' ? [page.data.aliases] : [])
        ).reduce(function (set, alias) {
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
