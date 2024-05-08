module.exports = class WikilinkParser {
  /**
   * This regex finds all WikiLink style links: [[id|optional text]] as well as WikiLink style embeds: ![[id]]
   *
   * @type {RegExp}
   */
  wikiLinkRegExp = /(?<!!)(!?)\[\[([^|]+?)(\|([\s\S]+?))?]]/g;

  /**
   * @param { import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions } opts
   * @param { DeadLinks } deadLinks
   */
  constructor(opts, deadLinks) {
    this.opts = opts;
    this.deadLinks = deadLinks;

    // TODO: when 11ty is in serve mode, this cache should clear at the beginning of each build (#24)
    this.linkCache = new Map();
  }

  /**
   * Parses a single WikiLink into the link object understood by the Interlinker.
   *
   * @todo add parsing of namespace (#14)
   *
   * @param {string} link
   * @param {import('@photogabble/eleventy-plugin-interlinker').PageDirectoryService} pageDirectory
   * @param {string|undefined} filePathStem
   * @return {import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta}
   */
  parseSingle(link, pageDirectory, filePathStem = undefined) {
    if (this.linkCache.has(link)) {
      return this.linkCache.get(link);
    }

    // Wikilinks starting with a ! are considered Embeds e.g. `![[ ident ]]`
    const isEmbed = link.startsWith('!');

    // By default, we display the linked page's title (or alias if used for lookup). This can be overloaded by
    // defining the link text prefixed by a | character, e.g. `[[ ident | custom link text ]]`
    const parts = link.slice((isEmbed ? 3 : 2), -2).split("|").map(part => part.trim());

    // Strip .md and .markdown extensions from the file ident; this is so it can be used for filePathStem match
    // if path lookup.
    let name = parts[0].replace(/.(md|markdown)\s?$/i, "");

    ////
    // Anchor link identification:
    // This works similar to Obsidian.md except this doesn't look ahead to check if the referenced anchor exists.
    // An anchor link can be referenced by a # character in the file ident, e.g. `[[ ident#anchor-id ]]`.
    //
    // This supports escaping by prefixing the # with a /, e.g `[[ Page about C/# ]]`
    let anchor = null;

    if (name.includes('#')) {
      const nameParts = parts[0].split('#').map(part => part.trim());
      // Allow for escaping a # when prefixed with a /
      if (nameParts[0].at(-1) !== '/') {
        name = nameParts[0];
        anchor = nameParts[1];
      } else {
        name = name.replace('/#', '#');
      }
    }

    ////
    // Path link identification:
    // This supports both relative links from the linking files path and lookup from the project root path.
    const isPath = (name.startsWith('/') || name.startsWith('../') || name.startsWith('./'));

    // This is a relative path lookup, need to mutate name so that its absolute path from project
    // root so that we can match it on a pages filePathStem.
    if (isPath && name.startsWith('.')) {
      if (!filePathStem) throw new Error('Unable to do relative path lookup of wikilink.');

      const cwd = filePathStem.split('/');
      const relative = name.split('/');
      const stepsBack = relative.filter(file => file === '..').length;

      name = [
        ...cwd.slice(0, -(stepsBack + 1)),
        ...relative.filter(file => file !== '..' && file !== '.')
      ].join('/');
    }

    ////
    // Custom Resolving Fn:
    // If the author has referenced a custom resolving function via inclusion of the `:` character
    // then we use that one. Otherwise, use the default resolving functions.
    // As with anchor links, this supports escaping the `:` character by prefixing with `/`
    let fnName = isEmbed
      ? 'default-embed'
      : 'default'

    if (name.includes(':')) {
      const parts = name.split(':').map(part => part.trim());
      if (parts[0].at(-1) !== '/') {
        fnName = parts[0];
        name = parts[1];
      } else {
        name = name.replace('/:', ':');
      }
    }

    if (!this.opts.resolvingFns || this.opts.resolvingFns.has(fnName) === false) {
      throw new Error(`Unable to find resolving fn [${fnName}] for wikilink ${link} on page [${filePathStem}]`);
    }

    /** @var {import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta} */
    const meta = {
      title: parts.length === 2 ? parts[1] : null,
      name,
      anchor,
      link,
      isEmbed,
      isPath,
      exists: false,
    }

    if (fnName) meta.resolvingFnName = fnName;

    // Lookup page data from 11ty's collection to obtain url and title if currently null
    const {page, foundByAlias} = pageDirectory.findByLink(meta);
    if (page) {
      if (foundByAlias) {
        meta.title = meta.name;
      } else if (meta.title === null && page.data.title) {
        meta.title = page.data.title;
      }
      meta.href = page.url;
      meta.path = page.inputPath;
      meta.exists = true;
      meta.page = page;
    } else if (['default', 'default-embed'].includes(fnName)) {
      // If this wikilink goes to a page that doesn't exist, add to deadLinks list and
      // update href for stub post.
      this.deadLinks.add(link);
      // @todo make the stub post url configurable, or even able to be disabled. (#25)
      meta.href = '/stubs';

      if (isEmbed) meta.resolvingFnName = '404-embed';
    }

    // Cache discovered meta to link, this cache can then be used by the Markdown render rule
    // to display the link.
    this.linkCache.set(link, meta);

    return meta;
  }

  /**
   * @param {Array<string>} links
   * @param {import('@photogabble/eleventy-plugin-interlinker').PageDirectoryService} pageDirectory
   * @param {string|undefined} filePathStem
   * @return {Array<import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta>}
   */
  parseMultiple(links, pageDirectory, filePathStem) {
    return links.map(link => this.parseSingle(link, pageDirectory, filePathStem));
  }

  /**
   * Finds all wikilinks within a document (HTML or otherwise) and returns their
   * parsed result.
   *
   * @param {string} document
   * @param {import('@photogabble/eleventy-plugin-interlinker').PageDirectoryService} pageDirectory
   * @param {string|undefined} filePathStem
   * @return {Array<import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta>}
   */
  find(document, pageDirectory, filePathStem) {
    return this.parseMultiple(
      (document.match(this.wikiLinkRegExp) || []),
      pageDirectory,
      filePathStem
    )
  }
}
