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

  // resolvingFns is a list of resolving functions. These are invoked by a wikilink containing a `:` character
  // prefixed by the fn name. The page in this case is the linking page.
  resolvingFns?: Map<string, (link: WikilinkMeta, page: any) => Promise<string>>,
}

interface ErrorRenderFn {
  (slug: string): string;
}

interface SlugifyFn {
  (input: string): string;
}

// Data structure for internal links identified by HTMLLinkParser.
// This is a subset of WikilinkMeta.
type LinkMeta = {
  href: string
  isEmbed: false
}

// Data structure for wikilinks identified by WikiLinkParser.
type WikilinkMeta = {
  title: string|null
  name: string
  anchor: string|null
  link: string
  slug: string
  isEmbed: boolean
  isPath: boolean

  // If linked page has been found in the all collection exists will be
  // true and page will be the 11ty page object.
  exists: boolean
  page?: any

  // name of the resolving fn, if set it must exist
  resolvingFnName?: string
  // the resulting HTML of the resolving function
  content?: string

  // href and path are loaded from the linked page
  href?: string
  path?: string
}

interface PageDirectoryService {
  findByLink(link : WikilinkMeta|LinkMeta): {page: any, found: boolean, foundByAlias: boolean};
  findByFile(file : any): any;
}

export {EleventyPluginInterlinkOptions, SlugifyFn, WikilinkMeta, LinkMeta, PageDirectoryService};
