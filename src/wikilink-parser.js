/**
 * @implements {import('@photogabble/eleventy-plugin-interlinker').WikiLinkParserInterface}
 */
module.exports = class WikilinkParser {
  /**
   * This regex finds all WikiLink style links: [[id|optional text]] as well as WikiLink style embeds: ![[id]]
   * @type {RegExp}
   */
  wikiLinkRegExp = /(?<!!)(!?)\[\[([^|]+?)(\|([\s\S]+?))?\]\]/g;

  slugifyFn

  /**
   * @param { import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions } opts
   */
  constructor(opts) {
    this.slugifyFn = opts.slugifyFn;
  }

  parseSingle (link) {
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

  parseMultiple (links) {
    return links.map(link => this.parseSingle(link));
  }
}
