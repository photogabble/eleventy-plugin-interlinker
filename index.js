import {install} from './src/markdown-ext.js';
import Interlinker from './src/interlinker.js';
import {defaultResolvingFn, defaultEmbedFn} from './src/resolvers.js';

/**
 * Some code borrowed from:
 * @see https://git.sr.ht/~boehs/site/tree/master/item/html/pages/garden/garden.11tydata.js
 * @see https://github.com/oleeskild/digitalgarden/blob/main/src/helpers/linkUtils.js
 *
 * @param { import('@11ty/eleventy/src/UserConfig') } eleventyConfig
 * @param { import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions } options
 */
export default function (eleventyConfig, options = {}) {
  /** @var { import('@photogabble/eleventy-plugin-interlinker').EleventyPluginInterlinkOptions } opts */
  const opts = Object.assign({
    defaultLayout: null,
    defaultLayoutLang: null,
    layoutKey: 'embedLayout',
    layoutTemplateLangKey: 'embedLayoutLanguage',
    resolvingFns: new Map(),
    deadLinkReport: 'console',
  }, options);

  // TODO: deprecate usage of unableToLocateEmbedFn in preference of using resolving fn
  if (typeof opts.unableToLocateEmbedFn === 'function' && !opts.resolvingFns.has('404-embed')) {
    opts.resolvingFns.set('404-embed', async (link) => opts.unableToLocateEmbedFn(link.page.fileSlug));
  }

  // Set default stub url if not set by author.
  if (typeof opts.stubUrl === 'undefined') opts.stubUrl = '/stubs/';

  // Default resolving functions for converting a Wikilink into HTML.
  if (!opts.resolvingFns.has('default')) opts.resolvingFns.set('default', defaultResolvingFn);
  if (!opts.resolvingFns.has('default-embed')) opts.resolvingFns.set('default-embed', defaultEmbedFn);
  if (!opts.resolvingFns.has('404-embed')) opts.resolvingFns.set('404-embed', async () => '[UNABLE TO LOCATE EMBED]');

  const interlinker = new Interlinker(opts);

  // This populates templateConfig with an instance of TemplateConfig once 11ty has initiated it, it's
  // used by the template compiler function that's exported by the EleventyRenderPlugin and used
  // by the defaultEmbedFn resolving function for compiling embed templates.
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
  eleventyConfig.on('eleventy.after', () => {
    if (opts.deadLinkReport !== 'none') interlinker.deadLinks.report(opts.deadLinkReport);
  });

  // Reset the internal state of the interlinker if running in watch mode, this stops
  // the interlinker from working against out of date data.
  eleventyConfig.on('eleventy.beforeWatch', () => {
    interlinker.reset();
  });

  // Teach Markdown-It how to display MediaWiki Links.
  eleventyConfig.amendLibrary('md', (md) => install(md, interlinker.wikiLinkParser));

  // Add outboundLinks computed global data, this is executed before the templates are compiled and
  // thus markdown parsed.
  eleventyConfig.addGlobalData('eleventyComputed.outboundLinks', () => {
    return async (data) => interlinker.compute(data);
  });

  // TODO: 1.1.0 Make Interlinker class available via global data
};
