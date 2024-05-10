---
title: "Adding Wiki Links to 11ty"
tags: [Blogging, 11ty, "Wiki Links"]
aliases: [wiki-links]
growthStage: seedling
---

Hello World

{% raw %}
```js
module.exports = function(md, linkMapCache) {
  // Recognize Mediawiki links ([[text]])
  md.linkify.add("[[", {
    validate: /^\s?([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/,
    normalize: match => {
      const parts = match.raw.slice(2, -2).split("|");
      const slug = slugify(parts[0].replace(/.(md|markdown)\s?$/i, "").trim());
      const found = linkMapCache.get(slug);

      if (!found) throw new Error(`Unable to find page linked by wikilink slug [${slug}]`)

      match.text = parts.length === 2
        ? parts[1]
        : found.title;

      match.url = found.permalink.substring(0,1) === '/'
        ? found.permalink
        : `/${found.permalink}`;
    }
  })
};
```
{% endraw %}

[[ test ]]
