import HTMLLinkParser from "../src/html-link-parser.js";
import DeadLinks from "../src/dead-links.js";
import { pageLookup } from "../src/find-page.js";
import test from "ava";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pageDirectory = pageLookup([]);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("html link parser grabs multiple href, ignoring external links", (t) => {
  const parser = new HTMLLinkParser(new DeadLinks());
  const links = parser.find(
    '<p>Hello world <a href="/home">this is a link home</a> and <a href="/somewhere">this is a link somewhere</a></p><p>The following link should be ignored <a href="https://www.example.com/">example.com</a>.</p>',
    pageDirectory
  );

  t.is(links.length, 2);

  const expectedLinks = ["/home", "/somewhere"];
  for (const link of links) {
    t.is(false, link.isEmbed); // HTML embed not supported for anchor links

    const idx = expectedLinks.indexOf(link.href);
    t.is(true, idx !== -1);

    expectedLinks.splice(idx, 1);
  }

  t.is(expectedLinks.length, 0);
});

test("html link parser ignores href within code blocks", (t) => {
  t.is(
    0,
    new HTMLLinkParser(new DeadLinks()).find(
      '<code><a href="/home">this is a link home</a></code>',
      pageDirectory
    ).length
  );

  const html = fs.readFileSync(__dirname + "/fixtures/within-code.html", {
    encoding: "utf8",
    flag: "r",
  });
  t.is(1, new HTMLLinkParser(new DeadLinks()).find(html, pageDirectory).length);
});

test("html link parser handles CSS parsing errors gracefully", (t) => {
  const html = `
    <style>
      .example { color: {% getBundle "css" %}; }
    </style>
    <p>This should still work: <a href="/test">Test Link</a></p>
  `;

  const parser = new HTMLLinkParser(new DeadLinks());
  const links = parser.find(html, pageDirectory);

  // Should find the link despite CSS parsing errors
  t.is(links.length, 1);
  t.is(links[0].href, "/test");
});
