const HTMLLinkParser = require("./html-link-parser");
const WikilinkParser = require("./wikilink-parser");
const {EleventyRenderPlugin} = require("@11ty/eleventy");
const DeadLinks = require("./dead-links");
const {pageLookup} = require("./find-page");

/**
 * Interlinker:
 *
 */
module.exports = class Interlinker {
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
   * Compiles the template associated with a WikiLink when invoked via the ![[embed syntax]]
   * @param data
   * @return {Promise<string|undefined>}
   */
  async compileTemplate(data) {
    if (this.compiledEmbeds.has(data.url)) return;

    const frontMatter = data.template.frontMatter;

    const layout = (data.data.hasOwnProperty(this.opts.layoutKey))
      ? data.data[this.opts.layoutKey]
      : this.opts.defaultLayout;

    const language = (data.data.hasOwnProperty(this.opts.layoutTemplateLangKey))
      ? data.data[this.opts.layoutTemplateLangKey]
      : this.opts.defaultLayoutLang === null
        ? data.page.templateSyntax
        : this.opts.defaultLayoutLang;

    const tpl = layout === null
      ? frontMatter.content
      : `{% layout "${layout}" %} {% block content %} ${frontMatter.content} {% endblock %}`;

    const fn = await this.rm.compile(tpl, language, {
      templateConfig: this.templateConfig,
      extensionMap: this.extensionMap
    });

    const result = await fn({content: frontMatter.content, ...data.data});

    this.compiledEmbeds.set(data.url, result);

    return result;
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
      const outboundLinks  = [
        ...this.wikiLinkParser.find(pageContent, pageDirectory, currentPage.filePathStem),
        ...this.HTMLLinkParser.find(pageContent, pageDirectory),
      ].map((link) => {
        // Lookup the page this link, links to and add this page to its backlinks
        const {page, found} = pageDirectory.findByLink(link);
        if (!found) return link;

        if (!page.data.backlinks) {
          page.data.backlinks = [];
        }

        if (page.data.backlinks.findIndex((backlink => backlink.url === currentPage.url)) === -1) {
          page.data.backlinks.push({
            url: currentPage.url,
            title: currentPage.data.title,
          });
        }

        // If this is an embed and the embed template hasn't been compiled, add this to the queue
        // @TODO compiledEmbeds should be keyed by the wikilink text as i'll be allowing setting embed values via namespace, or other method e.g ![[ident||template]]
        if (link.isEmbed && link.exists && this.compiledEmbeds.has(link.slug) === false) {
          compilePromises.push(this.compileTemplate(page));
        }

        return link;
      });

      // Block iteration until compilation complete.
      if (compilePromises.length > 0) await Promise.all(compilePromises);

      // The computed outbound links for the current page.
      return outboundLinks;
    }

    return [];
  }
}
