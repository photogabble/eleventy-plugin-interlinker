import HTMLLinkParser from './html-link-parser.js';
import WikilinkParser from './wikilink-parser.js';
import DeadLinks from './dead-links.js';
import {pageLookup} from './find-page.js';

/**
 * Interlinker:
 *
 */
export default class Interlinker {
  /**
   * @param {import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions} opts
   */
  constructor(opts) {
    this.opts = opts

    // Map of WikiLinks pointing to non-existent pages
    this.deadLinks = new DeadLinks();

    // Map of Wikilink Meta that have been resolved by the WikilinkParser
    this.linkCache = new Map();

    // Instance of TemplateConfig loaded by the `eleventy.config` event
    this.templateConfig = undefined;

    // Instance of EleventyExtensionMap loaded by the `eleventy.extensionmap` event
    this.extensionMap = undefined;

    this.wikiLinkParser = new WikilinkParser(opts, this.deadLinks, this.linkCache);
    this.HTMLLinkParser = new HTMLLinkParser(this.deadLinks);
  }

  reset() {
    this.deadLinks.clear();
    this.linkCache.clear();
  }

  /**
   * This is a computed function that gets added to the global data of 11ty prompting its
   * invocation for every page.
   *
   * @param {Object} data
   * @return {Promise<Array<any>>}
   */
  async compute(data) {
    // 11ty will invoke this several times during its build cycle, accessing the values we
    // need helps 11ty automatically detect data dependency and invoke the function only
    // once they are met.
    // @see https://www.11ty.dev/docs/data-computed/#declaring-your-dependencies
    const dependencies = [data.title, data.page, data.collections.all];
    if (dependencies[0] === undefined || !dependencies[1].inputPath || dependencies[2].length === 0) return [];

    this.deadLinks.setFileSrc(data.page.inputPath);

    const compilePromises = [];
    const pageDirectory = pageLookup(data.collections.all);

    const currentPage = pageDirectory.findByFile(data);
    if (!currentPage) return [];

    // TODO: 1.1.0 keep track of defined aliases and throw exception if duplicates are found (#46)

    // Identify this pages outbound internal links both as wikilink _and_ regular html anchor tags. For each out-link
    // lookup the other page and add this to its backlinks data value.
    const template = await currentPage.template.read();

    if (template?.content) {
      const pageContent = template.content;
      const outboundLinks = [
        ...this.wikiLinkParser.find(pageContent, pageDirectory, currentPage.filePathStem),
        ...this.HTMLLinkParser.find(pageContent, pageDirectory),
      ];

      // Foreach link on this page, if it has its own resolving function we invoke that
      // otherwise the default behaviour is to look up the page and add this page to
      // its backlinks list.

      for (const link of outboundLinks) {
        if (link.resolvingFnName) {
          const fn = this.opts.resolvingFns.get(link.resolvingFnName);
          link.content = await fn(link, currentPage, this);
        }

        // If the linked page exists we can add the linking page to its backlinks array
        if (link.exists) {
          if (!link.page.data.backlinks) link.page.data.backlinks = [];
          if (link.page.data.backlinks.findIndex((backlink => backlink.url === currentPage.url)) === -1) {
            link.page.data.backlinks.push({
              url: currentPage.url,
              title: currentPage.data.title,
            });
          }
        }
      }

      // Block iteration until compilation complete.
      if (compilePromises.length > 0) await Promise.all(compilePromises);

      // The computed outbound links for the current page.
      return outboundLinks;
    }

    return [];
  }
}
