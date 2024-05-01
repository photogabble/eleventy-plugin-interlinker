module.exports = class WikilinkParser {
  /**
   * This regex finds all WikiLink style links: [[id|optional text]] as well as WikiLink style embeds: ![[id]]
   *
   * @type {RegExp}
   */
  wikiLinkRegExp = /(?<!!)(!?)\[\[([^|]+?)(\|([\s\S]+?))?]]/g;

  /**
   * @param {Set<string>} deadWikiLinks
   * @param { import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions } opts
   */
  constructor(opts, deadWikiLinks) {
    this.opts = opts;
    this.slugifyFn = opts.slugifyFn;
    this.deadWikiLinks = deadWikiLinks;

    // TODO: when 11ty is in serve mode, this cache should clear at the beginning of each build (add issue)
    this.linkCache = new Map();
  }

  /**
   * Parses a single WikiLink into the link object understood by the Interlinker.
   *
   * @todo add parsing of namespace (#14)
   * @todo add support for referencing file by path (#13)
   *
   * @param {string} link
   * @param {import('@photogabble/eleventy-plugin-interlinker').PageDirectoryService} pageDirectory
   * @return {import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta}
   */
  parseSingle(link, pageDirectory) {
    if (this.linkCache.has(link)) {
      return this.linkCache.get(link);
    }

    const isEmbed = link.startsWith('!');
    const parts = link.slice((isEmbed ? 3 : 2), -2).split("|").map(part => part.trim());
    let name = parts[0].replace(/.(md|markdown)\s?$/i, "");
    let anchor = null;

    if (name.includes('#')) {
      const nameParts = parts[0].split('#').map(part => part.trim());
      name = nameParts[0];
      anchor = nameParts[1];
    }

    const slug = this.slugifyFn(name);

    if (name.startsWith('/')) {
      // TODO: if name begins with / then this is lookup by pathname (#13)
    }

    /** @var {import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta} */
    const meta = {
      title: parts.length === 2 ? parts[1] : null,
      name,
      anchor,
      link,
      slug,
      isEmbed
    }

    // Lookup page data from 11ty's collection to obtain url and title if currently null
    const page = pageDirectory.findByLink(meta);
    if (page) {
      if (meta.title === null && page.data.title) meta.title = page.data.title;
      meta.href = page.url;
      meta.path = page.inputPath;
    } else {
      // If this wikilink goes to a page that doesn't exist, add to deadWikiLinks list and
      // update href for stub post.
      this.deadWikiLinks.add(link);
      // @todo make the stub post url configurable, or even able to be disabled. (add issue)
      meta.href = '/stubs';
    }

    // Cache discovered meta to link, this cache can then be used by the Markdown render rule
    // to display the link.
    this.linkCache.set(link, meta);

    return meta;
  }

  /**
   * @param {Array<string>} links
   * @param {import('@photogabble/eleventy-plugin-interlinker').PageDirectoryService} pageDirectory
   * @return {Array<import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta>}
   */
  parseMultiple(links, pageDirectory) {
    return links.map(link => this.parseSingle(link, pageDirectory));
  }

  /**
   * Finds all wikilinks within a document (HTML or otherwise) and returns their
   * parsed result.
   *
   * @param {string} document
   * @param {import('@photogabble/eleventy-plugin-interlinker').PageDirectoryService} pageDirectory
   * @return {Array<import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta>}
   */
  find(document, pageDirectory) {
    return this.parseMultiple(
      (document.match(this.wikiLinkRegExp) || []),
      pageDirectory
    )
  }
}
