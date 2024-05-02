# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Add inclusion of html internal links to backlink computation
- Add detailed bad link report (#26)

## [1.0.6]

- Bugfix ensuring aliases value is array when treated as one (#17)
- Updated npm dependencies

## [1.0.5]

- Change to use `url` instead of `inputPath` for unique page key, this is because some pages can share the same `inputPath` such as those generated via pagination.

## [1.0.4]

- Bugfix template `content` variable not being set when rendering embed (#10)
- Bugfix incorrect alias lookup when only embedded as alias (#11)

## [1.0.3]

- Updated npm dependencies

## [1.0.2]

- Allow setting of embed render engine (#7)

## [1.0.1]

### Fixed

- Check if typeof link is undefined (#3)

## [1.0.0]

First release

[1.0.0]: https://github.com/photogabble/eleventy-plugin-font-subsetting/releases/tag/v1.0.0
[1.0.1]: https://github.com/photogabble/eleventy-plugin-font-subsetting/releases/tag/v1.0.1
[1.0.2]: https://github.com/photogabble/eleventy-plugin-font-subsetting/releases/tag/v1.0.2
[1.0.3]: https://github.com/photogabble/eleventy-plugin-font-subsetting/releases/tag/v1.0.3
[1.0.4]: https://github.com/photogabble/eleventy-plugin-font-subsetting/releases/tag/v1.0.4
[1.0.5]: https://github.com/photogabble/eleventy-plugin-font-subsetting/releases/tag/v1.0.5
[1.0.5]: https://github.com/photogabble/eleventy-plugin-font-subsetting/releases/tag/v1.0.6
