type EleventyPluginInterlinkOptions = {
  // defaultLayout is the optional default layout you would like to use for wrapping your embeds.
  defaultLayout?: string,

  // defaultLayoutLang is the optional default engine(s) used to render your embed layout. This
  // defaults to your 11ty project default for the embed source file; typically: liquid,md.
  defaultLayoutLang?: string,

  // layoutKey is the front-matter value used for a per embed template, if found it will replace defaultLayout for
  // that embed. This will always default to `embedLayout`.
  layoutKey?: string,

  // layoutTemplateLangKey informs the template renderer which engines to use for rendering an embed's layout. This
  // defaults to your 11ty projects default, typically: liquid,md
  layoutTemplateLangKey?: string,

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

export {EleventyPluginInterlinkOptions, SlugifyFn, WikilinkMeta};
