const HTMLLinkParser = require('../src/html-link-parser');
const test = require('ava');
const DeadLinks = require("../src/dead-links");
const {pageLookup} = require("../src/find-page");
const slugify = require("slugify");

const pageDirectory = pageLookup([], slugify);

test('html link parser grabs multiple href, ignoring external links', t => {
    const parser = new HTMLLinkParser(new DeadLinks());
    const links = parser.find('<p>Hello world <a href="/home">this is a link home</a> and <a href="/somewhere">this is a link somewhere</a></p><p>The following link should be ignored <a href="http://www.example.com/">example.com</a>.</p>', pageDirectory);

    t.is(2, links.length);

    const expectedLinks = ['/home', '/somewhere'];
    for (const link of links) {
      t.is(false, link.isEmbed); // HTML embed not supported for anchor links

      const idx = expectedLinks.indexOf(link.href);
      t.is(true, idx !== -1);

      expectedLinks.splice(idx, 1);
    }

    t.is(0, expectedLinks.length);
});
