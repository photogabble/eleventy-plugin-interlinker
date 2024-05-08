module.exports = class HTMLLinkParser {

  /**
   * This regex finds all html tags with an href that begins with / denoting they are internal links.
   *
   * @type {RegExp}
   */
  internalLinkRegex = /href="\/(.*?)"/g;

  /**
   * @param { DeadLinks } deadLinks
   */
  constructor(deadLinks) {
    this.deadLinks = deadLinks;
  }

  /**
   * Parses a single HTML link into the link object understood by the Interlinker. Unlike with Wikilinks we only
   * care about the href so that we can look up the linked page record.
   *
   * @param {string} link
   * @param {import('@photogabble/eleventy-plugin-interlinker').PageDirectoryService} pageDirectory
   * @return {import('@photogabble/eleventy-plugin-interlinker').LinkMeta}
   */
  parseSingle(link, pageDirectory) {
    const meta = {
      href: link.slice(6, -1)
        .replace(/.(md|markdown)\s?$/i, "")
        .replace("\\", "")
        .trim()
        .split("#")[0],
      isEmbed: false,
    };

    const {found, page} = pageDirectory.findByLink(meta);

    if (!found) {
      this.deadLinks.add(link);
      return meta;
    }

    meta.exists = true;
    meta.page = page;

    return meta;
  }

  /**
   * @param {Array<string>} links
   * @param {import('@photogabble/eleventy-plugin-interlinker').PageDirectoryService} pageDirectory
   * @return {Array<import('@photogabble/eleventy-plugin-interlinker').LinkMeta>}
   */
  parseMultiple(links, pageDirectory) {
    return links.map(link => this.parseSingle(link, pageDirectory));
  }

  /**
   * Find's all internal href links within an HTML document and returns the parsed result.
   * @param {string} document
   * @param {import('@photogabble/eleventy-plugin-interlinker').PageDirectoryService} pageDirectory
   * @return {Array<import('@photogabble/eleventy-plugin-interlinker').LinkMeta>}
   */
  find(document, pageDirectory) {
    return this.parseMultiple(
      (document.match(this.internalLinkRegex) || []),
      pageDirectory
    )
  }
}
