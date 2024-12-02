# Eleventy.js Interlink Plugin


I use [Obsidian.md](https://obsidian.md/) to draft my posts before they are published on PhotoGabble. One feature of #Obsidian that I love is interlinking between notes and being able to see the connectivity graph of each note.

In January 2023 I wrote about how I [added Wiki Links support to Eleventy.js](https://www.photogabble.co.uk/noteworthy/adding-wiki-links-to-11ty/) and in doing so this plugin was borne. It has since been updated to include support for Obsidian's [embedding files](https://help.obsidian.md/Linking+notes+and+files/Embedding+files).

## Install

```bash
npm i @photogabble/eleventy-plugin-interlinker
```

## Configuration

```ts
type EleventyPluginInterlinkOptions = {
  // defaultLayout is the optional default layout you would like
  // to use for wrapping your embeds.
  defaultLayout?: string,

  // defaultLayoutLang is the optional default engine(s) used to render
  // your embed layout. This defaults to your 11ty project default for
  // the embed source file; typically: liquid,md.
  defaultLayoutLang?: string,

  // layoutKey is the front-matter value used for a per embed
  // template, if found it will replace defaultLayout for
  // that embed. This will always default to `embedLayout`.
  layoutKey?: string,

  // layoutTemplateLangKey is the front-matter value used for setting the
  // layout engine(s) to render the embed's layout. This defaults to your
  // 11ty project default for the embed source file; typically: liquid,md.
  layoutTemplateLangKey?: string,

  // unableToLocateEmbedFn is invoked when an embed is unable
  // to be found, this is normally due to a typo in the
  // slug that you are using. This defaults to a function
  // that returns [UNABLE TO LOCATE EMBED].
  unableToLocateEmbedFn?: ErrorRenderFn,

  // deadLinkReport is the desired output format of the dead link report, by default its set to 'console'
  deadLinkReport?: 'console' | 'json' | 'none',

  // resolvingFns contains functions used for resolving a wikilinks output.
  // see the Custom Resolving Functions section below
  resolvingFns?: Map<string, (link: WikilinkMeta, currentPage: any, interlinker: Interlinker) => Promise<string>>
}
```

## Usage
In your Eleventy config file (defaults to .eleventy.js):

```js
module.exports = (eleventyConfig) => {
  eleventyConfig.addPlugin(
    require('@photogabble/eleventy-plugin-interlinker'),
    {
      defaultLayout: 'layouts/embed.liquid'
    }
  );
};
```

### Internal Links / Wikilinks

This plugin will parse both Wikilinks and internal anchor links to build each pages inbound and outbound internal links.

The Wikilink format is a **page reference** wrapped in double square brackets, for example: `[[Eleventy.js Interlink Plugin]]` will appear as [Eleventy.js Interlink Plugin](https://photogabble.co.uk/projects/eleventyjs-interlink-plugin/).

> **NOTE**: By default this plugin will use the `title` front-matter attribute of your pages or one of the aliases (as detailed below) as the **page reference**.

Using the vertical bar (`|`) you can change the text used to display a link. This can be useful when you want to work a link into a sentence without using the title of the file, for example: `[[Eleventy.js Interlink Plugin|custom display text]]` appears as [custom display text](https://www.photogabble.co.uk/projects/eleventyjs-interlink-plugin/).

### Linking to fragment identifiers

If you're using a plugin such as [markdown-it-anchor](https://www.npmjs.com/package/markdown-it-anchor) to add _anchor links_ to your headings, or have otherwise added them yourself. You can link to these in your pages by adding a `#` symbol to your page reference.

For example, `[[Three laws of motion#Second law]]`.

In cases where you have the `#` in the title of a page you're linking to you can escape using `/` foe example, `[[Programming in /#C, an introduction]]`.

### Linking to files by path

You can link to pages by their project path, or a path relative to the linking page, for example: `[[/blog/post-1234.md]]` would link to the page found at `/blog/post-1234` relative to the project root path, While `[[../../something.md]]` would link to a page two directories up.

### Aliases

Aliases provide you a way of referencing a file using different names, use the `aliases` property in your font matter to list one or more aliases that can be used to reference the file from a Wiki Link. For example, you might add _AI_ as an alias of a file titled _Artificial Intelligence_ which would then be linkable via `[[AI]]`.

These can be defined as either an array as shown below or a single alias via `aliaes: AI`.

```yaml
---
title: Artificial Intelligence
aliases:
  - AI
---
```

Aliases should be unique identifiers, this plugin will halt the build with an error if it finds two pages sharing the same alias.

### Linking to Pagination generated pages

A common use of pagination in 11ty is [pagination of an object](https://www.11ty.dev/docs/pagination/#paging-an-object) or data file, by default these generated pages aren't included in the all pages collection and therefore are invisible to this plugin unless you set `addAllPagesToCollections: true`.

Once done you will also need to set the title of each generated page so that this plugin can reference them, that can be done with `eleventyComputed` for example:

```yaml
---
pagination:
  data: collections.lists
  size: 1
  alias: list
  addAllPagesToCollections: true
permalink: "{{ list.permalink }}"
folder: lists
eleventyComputed:
  title: "{{ list.title }}"
---
```

### Custom Resolving Functions

Custom resolving functions can be considered pluggable extensions to the wikilink lookup and rendering logic and can be invoked by usage of a `:` character in a wikilink prefixed by the functions name, for example: `[[issue:19]]`.

These functions are added to the interlinker via its `resolvingFns` configuration options, for example:

```javascript
const config = {
  resolvingFns: new Map([
    ['howdy', (link, currentPage) => `Hello ${link.name}!`],
    ['issue', (link, currentPage) => `<a href="${currentPage.data.github}/issues/${link.name}">#${link.name}</a>`],
  ]),
};
```

When invoked the resolving function will be passed three arguments, the parsed Wikilink object (see _Wikilink Data Structure_ section below.) The linking page object from 11ty and the interlinker class instance.

The plugin has three internal resolving functions which are defined only if not already via the plugin config:

- `default`, this is the default resolving function and converts the Wikilink Data Structure directly into an HTML link
- `default-embed`, this is the default embed resolving function
- `404-embed`, this is invoked when the embed template is not found. This currently invokes the `unableToLocateEmbedFn` however, in a future version it will replace that config option entirely

### Embedding

Embedding files allows you to reuse content across your website while tracking what pages have used it.

To embed a file add an exclamation mark (`!`) in front of any wiki link for example: `![Artificial Intelligence]`. The embedded file will be rendered using 11ty's Template Engine. If you have defined a default embedding layout through `defaultLayout` or the page being embedded has front matter keyed as `layoutKey` then the embed will be rendered wrapped with the discovered template.

For example, with the default `layoutKey` your front matter might look like:

```yaml
---
embedLayout: 'layouts/bookmark-embed.liquid'
---
```

When embedding that page its data and content will be injected in to `layouts/bookmark-embed.liquid`, rendered and replace the embed declaration.

#### Inline Embeds

When rendering each embed this plugin will use the template engine as set on the file being embedded.

For most 11ty projects this defaults to `liquid,md`. The Markdown parser will wrap any inline html elements in a pair of `<p>` tags which may not be what you want to happen, especially if your using the embed inline within a paragraph of text. To overcome this you may define which template language(s) should be used to compile the embed layout by using front matter keyed as `layoutTemplateLangKey`.

For example, you might have a folder of bookmarks that you would like to embed into other pages as inline links, your `bookmarks.11tydata.js` might look like the following:

```js
module.exports = {
  embedLayout: 'layouts/bookmark-embed.liquid',
  embedLayoutLanguage: 'liquid',
}
```

This will disable the Markdown parser for the defined `embedLayout` resulting in the correct behaviour for inline embeds.

### Back Links

A backlink for a page is a link from another page to that page; this plugin tracks all backlinks through either embedding or internal wikilinks. This data is made available to your page via its `backlinks` data value.

You can then display this information in any way you would like, I use the below snippet the result of which you can see in most pages on PhotoGabble.

```twig
{% if backlinks.length > 0 %}
    <nav>
        <h3>Linking here</h3>
        <ul>
            {% for link in backlinks %}
                <li><a href="{{ link.url }}">{{ link.title }}</a></li>
            {% endfor %}
        </ul>
    </nav>
{% endif %}
```

### Dead link Report

The default behaviour of this plugin is to report to the console every broken Wikilink and internal link. This behaviour is configurable via the `deadLinkReport` config option. This option accepts three values: `none`, `console` and `json` with `console` being the default.

Setting the value to `none` will disable the dead link report while setting it to `json` will silence console output instead writing to `.dead-links.json` within the project root folder.

### Page lookup logic

This plugin will attempt to identify the page being linked using the following steps in order:

1. if is path link, return `filePathStem` match state
2. match file url to link href
3. match file title to link identifier (name)
4. match file slug to link identifier (name)
5. match file based upon alias

### Pages Excluded from Collections

Due to how this plugin obtains a pages template content, all pages with `eleventyExcludeFromCollections:true` set will **NOT** be parsed by the interlinker.

## Wikilink Data Structure

```typescript
type WikilinkMeta = {
  title: string | null
  name: string
  anchor: string | null
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
```

## Known Caveats

- This plugin doesn't implement all [Obsidian's wikilink support](https://help.obsidian.md/Linking+notes+and+files/Internal+links) for example linking to a block in a note and linking to a heading in a note is not currently supported by this plugin
- Only supports embedding one note inside another, no other Obsidian file embedding functionality is currently supported by this plugin

## Roadmap

I'd like to add missing features that others might use from Obsidian.md. For example #WikiLinks that point to a heading within the destination and embeds that are able to reference a heading or block within the source document.

In addition, being able to add a node graph view to visually show interlinking would be _cool_!

## License

This 11ty plugin is open-sourced software licensed under the [MIT License](LICENSE)
