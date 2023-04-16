const {wikilinkInlineRule, wikilinkRenderRule} = require('./src/markdown-ext');
const { EleventyRenderPlugin } = require('@11ty/eleventy');
const WikilinkParser = require('./src/wikilink-parser');
const chalk = require('chalk');

/**
 * Some code borrowed from:
 * @see https://git.sr.ht/~boehs/site/tree/master/item/html/pages/garden/garden.11tydata.js
 *
 * @param { import('@11ty/eleventy/src/UserConfig') } eleventyConfig
 * @param { import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions } options
 */
module.exports = function (eleventyConfig, options = {}) {
  /** @var { import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions } opts */
  const opts = Object.assign({
    defaultLayout: null,
    layoutKey: 'embedLayout',
    unableToLocateEmbedFn: () => '[UNABLE TO LOCATE EMBED]',
    slugifyFn: (input) => {
      const slugify = eleventyConfig.getFilter('slugify');
      if(typeof slugify !== 'function') throw new Error('Unable to load slugify filter.');

      return slugify(input);
    },
  }, options);

  const rm = new EleventyRenderPlugin.RenderManager();
  const wikilinkParser = new WikilinkParser(opts);

  const compileTemplate = async (data) => {
    if (compiledEmbeds.has(data.inputPath)) return;

    const frontMatter = data.template.frontMatter;

    const layout =  (data.data.hasOwnProperty(opts.layoutKey))
      ? data.data[opts.layoutKey]
      : opts.defaultLayout;

    const tpl = layout === null
      ? frontMatter.content
      : `{% layout "${layout}" %} {% block content %} ${frontMatter.content} {% endblock %}`;

    const fn = await rm.compile(tpl, data.page.templateSyntax, {templateConfig, extensionMap});
    const result = await fn(data.data);

    compiledEmbeds.set(data.inputPath, result);
  }

  let templateConfig;
  eleventyConfig.on("eleventy.config", (cfg) => {
    templateConfig = cfg;
  });

  let extensionMap;
  eleventyConfig.on("eleventy.extensionmap", (map) => {
    extensionMap = map;
  });

  // Set of WikiLinks pointing to non-existent pages
  const deadWikiLinks = new Set();

  // Map of what WikiLinks to what
  const linkMapCache = new Map();

  // Map of WikiLinks that have triggered an embed compile
  const compiledEmbeds = new Map();

  eleventyConfig.on('eleventy.after', () => {
    deadWikiLinks.forEach(
      slug => console.warn(chalk.blue('[@photogabble/wikilinks]'), chalk.yellow('WARNING'), `WikiLink found pointing to non-existent [${slug}], has been set to default stub.`)
    );
  });

  // Teach Markdown-It how to display MediaWiki Links.
  eleventyConfig.amendLibrary('md', (md) => {
    // WikiLink Embed
    md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
      wikilinkParser,
    ));

    md.renderer.rules.inline_wikilink = wikilinkRenderRule(
      wikilinkParser,
      linkMapCache,
      compiledEmbeds,
      deadWikiLinks,
      opts
    );
  });

  // Add backlinks computed global data, this is executed before the templates are compiled and thus markdown parsed.
  eleventyConfig.addGlobalData('eleventyComputed', {
    backlinks: async (data) => {
      // @see https://www.11ty.dev/docs/data-computed/#declaring-your-dependencies
      const dependencies = [data.title, data.page, data.collections.all];
      if (dependencies[0] === undefined || !dependencies[1].fileSlug || dependencies[2].length === 0) return [];

      const compilePromises = [];
      const allPages = data.collections.all;
      const currentSlug = opts.slugifyFn(data.title);
      let backlinks = [];
      let currentSlugs = new Set([currentSlug, data.page.fileSlug]);
      const currentPage = allPages.find(page => page.inputPath === data.page.inputPath);

      // Populate our link map for use later in replacing WikiLinks with page permalinks.
      // Pages can list aliases in their front matter, if those exist we should map them
      // as well.

      linkMapCache.set(currentSlug, {
        page: data.collections.all.find(page => page.inputPath === data.page.inputPath),
        title: data.title
      });

      // If a page has defined aliases, then add those to the link map. These must be unique.

      if (data.aliases) {
        for (const alias of data.aliases) {
          const aliasSlug = opts.slugifyFn(alias);
          linkMapCache.set(aliasSlug, {
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
          const outboundLinks = (pageContent.match(wikilinkParser.wikiLinkRegExp) || []);
          page.data.outboundLinks = wikilinkParser.parseMultiple(outboundLinks);

          page.data.outboundLinks
            .filter(link => link.isEmbed && compiledEmbeds.has(link.slug) === false)
            .map(link => allPages.find(page => {
              const found = (page.fileSlug === link.slug || (page.data.title && opts.slugifyFn(page.data.title) === link.slug));
              if (found) return true;

              const aliases = (page.aliases ?? []).reduce(function(set, alias){
                set.add(opts.slugifyFn(alias));
                return set;
              }, new Set());

              return aliases.has(link.slug);
            }))
            .filter(link => (typeof link !== 'undefined'))
            .forEach(link => compilePromises.push(compileTemplate(link)))
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
  });
};
