const {wikilinkInlineRule, wikilinkRenderRule} = require('./src/markdown-ext');
const {Interlinker} = require("./src/interlinker");

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
    // TODO: 1.1.0 add custom resolving functions (#19)
    defaultLayout: null,
    defaultLayoutLang: null,
    layoutKey: 'embedLayout',
    layoutTemplateLangKey: 'embedLayoutLanguage',
    unableToLocateEmbedFn: () => '[UNABLE TO LOCATE EMBED]',
    slugifyFn: (input) => {
      const slugify = eleventyConfig.getFilter('slugify');
      if (typeof slugify !== 'function') throw new Error('Unable to load slugify filter.');

      return slugify(input);
    },
  }, options);

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

  eleventyConfig.on('eleventy.after', () => interlinker.deadLinksReport());

  // Teach Markdown-It how to display MediaWiki Links.
  eleventyConfig.amendLibrary('md', (md) => {
    // WikiLink Embed
    md.inline.ruler.push('inline_wikilink', wikilinkInlineRule(
      interlinker.wikiLinkParser,
    ));

    md.renderer.rules.inline_wikilink = wikilinkRenderRule(
      interlinker.wikiLinkParser,
      interlinker.linkMapCache,
      interlinker.compiledEmbeds,
      interlinker.deadWikiLinks,
      opts
    );
  });

  // Add backlinks computed global data, this is executed before the templates are compiled and thus markdown parsed.
  eleventyConfig.addGlobalData('eleventyComputed', {
    backlinks: interlinker.computeBacklinks
  });
};
