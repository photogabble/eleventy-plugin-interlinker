module.exports = class HTMLLinkParser {

  /**
   * This regex finds all html tags with an href that begins with / denoting they are internal links.
   *
   * @type {RegExp}
   */
  internalLinkRegex = /href="\/(.*?)"/g;

  /**
   * Parses a single HTML link into the link object understood by the Interlinker. Unlike with Wikilinks we only
   * care about the href so that we can look up the linked page record.
   *
   * @param {string} link
   * @return {import('@photogabble/eleventy-plugin-interlinker').LinkMeta}
   */
  parseSingle(link) {
    return {
      href: link.slice(6, -1)
        .replace(/.(md|markdown)\s?$/i, "")
        .replace("\\", "")
        .trim()
        .split("#")[0],
      isEmbed: false,
    }
  }

  /**
   * @param {Array<string>} links
   * @return {Array<import('@photogabble/eleventy-plugin-interlinker').LinkMeta>}
   */
  parseMultiple(links) {
    return links.map(link => this.parseSingle(link));
  }

  /**
   * Find's all internal href links within an HTML document and returns the parsed result.
   * @param {string} document
   * @return {Array<import('@photogabble/eleventy-plugin-interlinker').LinkMeta>}
   */
  find(document) {
    return this.parseMultiple(
      (document.match(this.internalLinkRegex) || [])
    )
  }
}
