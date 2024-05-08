const {wikilinkInlineRule, wikilinkRenderRule} = require('./src/markdown-ext');
const Interlinker = require("./src/interlinker");
const {defaultResolvingFn, defaultEmbedFn} = require("./src/resolvers");

/**
 * Some code borrowed from:
 * @see https://git.sr.ht/~boehs/site/tree/master/item/html/pages/garden/garden.11tydata.js
 * @see https://github.com/oleeskild/digitalgarden/blob/main/src/helpers/linkUtils.js
 *
 * @param { import('@11ty/eleventy/src/UserConfig') } eleventyConfig
 * @param { import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions } options
 */
module.exports = function (eleventyConfig, options = {}) {
  /** @var { import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions } opts */
  const opts = Object.assign({
    defaultLayout: null,
    defaultLayoutLang: null,
    layoutKey: 'embedLayout',
    layoutTemplateLangKey: 'embedLayoutLanguage',
    slugifyFn: (input) => {
      const slugify = eleventyConfig.getFilter('slugify');
      if (typeof slugify !== 'function') throw new Error('Unable to load slugify filter.');

      return slugify(input);
    },
    resolvingFns: new Map(),
  }, options);

  // TODO: deprecate usage of unableToLocateEmbedFn in preference of using resolving fn
  if (typeof opts.unableToLocateEmbedFn === 'function' && !opts.resolvingFns.has('404-embed')) {
    opts.resolvingFns.set('404-embed', async (link) => opts.unableToLocateEmbedFn(link.page.fileSlug));
  }

  // Default resolving functions for converting a Wikilink into HTML.
  if (!opts.resolvingFns.has('default')) opts.resolvingFns.set('default', defaultResolvingFn);
  if (!opts.resolvingFns.has('default-embed')) opts.resolvingFns.set('default-embed', defaultEmbedFn);
  if (!opts.resolvingFns.has('404-embed')) opts.resolvingFns.set('404-embed', async () => '[UNABLE TO LOCATE EMBED]');

  const interlinker = new Interlinker(opts);

  // TODO: document
  eleventyConfig.on("eleventy.config", (cfg) => {
    interlinker.templateConfig = cfg;
  });

  // This triggers on an undocumented internal 11ty event that is triggered once EleventyExtensionMap
  // has been loaded. This is used by the EleventyRenderPlugin which is made user of within the
  // compileTemplate method of the Interlinker class.
  eleventyConfig.on("eleventy.extensionmap", (map) => {
    interlinker.extensionMap = map;
  });

  // After 11ty has finished generating the site output a list of wikilinks that do not link to
  // anything.
  // TODO: 1.1.0 have this contain more details such as which file(s) are linking (#23)
  // TODO: 1.1.0 have this clear the interlinker cache so that next time 11ty builds its starting from fresh data! (#24)
  eleventyConfig.on('eleventy.after', () => interlinker.deadLinks.report());

  // Teach Markdown-It how to display MediaWiki Links.
  eleventyConfig.amendLibrary('md', (md) => {
    // WikiLink Embed
    md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
      interlinker.wikiLinkParser,
    ));

    md.renderer.rules.inline_wikilink = wikilinkRenderRule(
      interlinker.wikiLinkParser,
      interlinker.compiledEmbeds,
      opts
    );
  });

  // Add outboundLinks computed global data, this is executed before the templates are compiled and
  // thus markdown parsed.
  eleventyConfig.addGlobalData('eleventyComputed.outboundLinks', () => {
    return async (data) => interlinker.compute(data);
  });

  // TODO: 1.1.0 Make Interlinker class available via global data
};
