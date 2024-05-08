const HTMLLinkParser = require("./html-link-parser");
const WikilinkParser = require("./wikilink-parser");
const {EleventyRenderPlugin} = require("@11ty/eleventy");
const DeadLinks = require("./dead-links");
const {pageLookup} = require("./find-page");
const entities = require("entities");

const defaultResolvingFn = async (currentPage, link) => {
  const text = entities.encodeHTML(link.title ?? link.name);
  let href = link.href;

  if (link.anchor) {
    href = `${href}#${link.anchor}`;
  }

  return `<a href="${href}">${text}</a>`;
}

/**
 * Interlinker:
 *
 */
module.exports = class Interlinker {
  /**
   * @param {import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions} opts
   */
  constructor(opts) {
    this.opts = opts

    // Set of WikiLinks pointing to non-existent pages
    this.deadLinks = new DeadLinks();

    // Map of WikiLinks that have triggered an embed compile
    this.compiledEmbeds = new Map();

    // TODO: document
    this.templateConfig = undefined;
    this.extensionMap = undefined;

    // TODO: document
    this.rm = new EleventyRenderPlugin.RenderManager();

    this.wikiLinkParser = new WikilinkParser(opts, this.deadLinks);

    // TODO: pass through deadWikiLinks and have HTMLLinkParser look up pages
    this.HTMLLinkParser = new HTMLLinkParser(this.deadLinks);
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

    const {slugifyFn} = this.opts;

    const compilePromises = [];
    const pageDirectory = pageLookup(
      data.collections.all,
      slugifyFn
    );

    const currentPage = pageDirectory.findByFile(data);
    if (!currentPage) return [];

    // TODO: 1.1.0 keep track of defined aliases and throw exception if duplicates are found (#46)

    // Identify this pages outbound internal links both as wikilink _and_ regular html anchor tags. For each outlink
    // lookup the other page and add this to its backlinks data value.
    if (currentPage.template.frontMatter?.content) {
      const pageContent = currentPage.template.frontMatter.content;
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
