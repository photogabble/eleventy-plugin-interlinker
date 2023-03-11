type EleventyPluginInterlinkOptions = {
  // defaultLayout is the optional default layout you would like to use for wrapping your embeds.
  defaultLayout?: string,

  // layoutKey is the front-matter value used for a per embed template, if found it will replace defaultLayout for
  // that embed. This will always default to `embedLayout`.
  layoutKey?: string,

  // unableToLocateEmbedFn is invoked when an embed is unable to be found, this is normally due to a typo in the
  // slug that you are using. This defaults to a function that returns [UNABLE TO LOCATE EMBED].
  unableToLocateEmbedFn?: ErrorRenderFn,

  // slugifyFn is used to slugify strings. If a function isn't set then the default 11ty slugify filter is used.
  slugifyFn?: SlugifyFn
}

interface ErrorRenderFn {
  (slug: string): string;
}

interface SlugifyFn {
  (input: string): string;
}

type WikilinkMeta = {
  title: string|null,
  name: string,
  link: string,
  slug: string,
  isEmbed: boolean
}

interface WikiLinkParserInterface {
  wikiLinkRegExp: RegExp;
  parseSingle(link: string): WikilinkMeta;
  parseMultiple(links: Array<string>): Array<WikilinkMeta>;
}

export {EleventyPluginInterlinkOptions, SlugifyFn, WikiLinkParserInterface, WikilinkMeta};
