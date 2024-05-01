module.exports = class WikilinkParser {
  /**
   * This regex finds all WikiLink style links: [[id|optional text]] as well as WikiLink style embeds: ![[id]]
   *
   * @type {RegExp}
   */
  wikiLinkRegExp = /(?<!!)(!?)\[\[([^|]+?)(\|([\s\S]+?))?]]/g;

  /**
   * @param { import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions } opts
   */
  constructor(opts) {
    this.slugifyFn = opts.slugifyFn;
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
  parseSingle(link) {
    const isEmbed = link.startsWith('!');
    const parts = link.slice((isEmbed ? 3 : 2), -2).split("|").map(part => part.trim());
    const slug = this.slugifyFn(parts[0].replace(/.(md|markdown)\s?$/i, "").trim());
    let name = parts[0];
    let anchor = null;

    if (name.includes('#')) {
      const nameParts = parts[0].split('#').map(part => part.trim());
      name = nameParts[0];
      anchor = nameParts[1];
    }

    return {
      title: parts.length === 2 ? parts[1] : null,
      name,
      anchor,
      link,
      slug,
      isEmbed
    }
  }

  parseMultiple(links) {
    return links.map(link => this.parseSingle(link));
  }

  /**
   * Finds all wikilinks within a document (HTML or otherwise).
   * @param {string} document
   * @param {import('@photogabble/eleventy-plugin-interlinker').PageDirectoryService} pageDirectory
   * @return {Array<import('@photogabble/eleventy-plugin-interlinker').WikilinkMeta>}
   */
  find(document) {
    return this.parseMultiple(
      (document.match(this.wikiLinkRegExp) || [])
    )
  }
}
