const {EleventyRenderPlugin} = require("@11ty/eleventy");
const WikilinkParser = require("./wikilink-parser");
const chalk = require("chalk");

class Interlinker {
  constructor(opts) {
    this.opts = opts

    // Set of WikiLinks pointing to non-existent pages
    this.deadWikiLinks = new Set();

    // Map of what WikiLinks to what
    this.linkMapCache = new Map();

    // Map of WikiLinks that have triggered an embed compile
    this.compiledEmbeds = new Map();

    // TODO: document
    this.templateConfig = undefined;
    this.extensionMap = undefined;

    // TODO: document
    this.rm = new EleventyRenderPlugin.RenderManager();
    this.wikiLinkParser = new WikilinkParser(opts);
  }

  /**
   * @todo document
   * @param data
   * @return {Promise<*>}
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
  async computeBacklinks(data) {
    // 11ty will invoke this several times during its build cycle, accessing the values we
    // need helps 11ty automatically detect data dependency and invoke the function only
    // once they are met.
    // @see https://www.11ty.dev/docs/data-computed/#declaring-your-dependencies
    const dependencies = [data.title, data.page, data.collections.all];
    if (dependencies[0] === undefined || !dependencies[1].fileSlug || dependencies[2].length === 0) return [];

    const {slugifyFn} = this.opts;

    const compilePromises = [];
    const allPages = data.collections.all;
    const currentSlug = slugifyFn(data.title);
    let backlinks = [];
    let currentSlugs = new Set([currentSlug, data.page.fileSlug]);
    const currentPage = allPages.find(page => page.url === data.page.url);

    // Populate our link map for use later in replacing WikiLinks with page permalinks.
    // Pages can list aliases in their front matter, if those exist we should map them
    // as well.

    // TODO: 1.1.0 key files by pathname (#13)
    // TODO: 1.1.0 key files by title (#5)
    this.linkMapCache.set(currentSlug, {
      page: data.collections.all.find(page => page.url === data.page.url),
      title: data.title
    });

    // If a page has defined aliases, then add those to the link map. These must be unique.

    if (data.aliases) {
      for (const alias of data.aliases) {
        const aliasSlug = slugifyFn(alias);
        this.linkMapCache.set(aliasSlug, {
          page: currentPage,
          title: alias
        });
        currentSlugs.add(aliasSlug)
      }
    }

    // Loop over all pages and build their outbound links if they have not already been parsed.

    allPages.forEach(page => {
      if (!page.data.outboundLinks) {
        const pageContent = page.template.frontMatter.content;
        const outboundLinks = (pageContent.match(this.wikiLinkParser.wikiLinkRegExp) || []);
        page.data.outboundLinks = this.wikiLinkParser.parseMultiple(outboundLinks);

        page.data.outboundLinks
          .filter(link => link.isEmbed && this.compiledEmbeds.has(link.slug) === false)
          .map(link => allPages.find(page => {
            const found = (page.fileSlug === link.slug || (page.data.title && slugifyFn(page.data.title) === link.slug));
            if (found) return true;

            const aliases = ((page.data.aliases && Array.isArray(page.data.aliases)) ? page.data.aliases : []).reduce(function (set, alias) {
              set.add(slugifyFn(alias));
              return set;
            }, new Set());

            return aliases.has(link.slug);
          }))
          .filter(link => (typeof link !== 'undefined'))
          .forEach(link => compilePromises.push(this.compileTemplate(link)))
      }

      // If the page links to our current page either by its title or by its aliases then
      // add that page to our current page's backlinks.
      if (page.data.outboundLinks.some(link => currentSlugs.has(link.slug))) {
        backlinks.push({
          url: page.url,
          title: page.data.title,
        })
      }
    });

    // Block iteration until compilation complete.
    if (compilePromises.length > 0) await Promise.all(compilePromises);

    // The backlinks for the current page.
    return backlinks;
  }

  deadLinksReport() {
    this.deadWikiLinks.forEach(
      slug => console.warn(chalk.blue('[@photogabble/wikilinks]'), chalk.yellow('WARNING'), `WikiLink found pointing to non-existent [${slug}], has been set to default stub.`)
    )
  }
}

module.exports = {
  Interlinker
}
