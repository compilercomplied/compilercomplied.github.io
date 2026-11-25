# gdario.dev

This site uses Zola and publishes static files to GitHub Pages.

## Preview locally

Run `mise install`, then `mise run serve`. Run `mise run check` and `mise run build` before publishing.

## Add a post or page

Add a file such as `content/blog/my-post.md` with TOML front matter, followed by the post in Markdown.

```toml
+++
title = "My post"
date = 2026-11-24
+++
```

Posts appear in the blog index in date order. The blog link appears in the site navigation when there is a published post. Set `draft = true` in the front matter to keep a post out of the build.

For a standalone page, add a Markdown file in `content/`. It uses the default reading layout. To give it a custom layout, set `template` in its front matter and extend `templates/base.html` from the selected template. Load page-specific CSS in its `styles` block.

The neutral tokens and shared styles live in `static/styles.css`. The homepage applies an SVG ordered-dither filter to the hillside image. CSS masks fade the filtered hills and the surrounding dot texture separately. The [Doop studies](https://design.gdario.dev/c/oKktGu55Qx?frame=QXZH1kzjhy) show the composition.

## Publish on GitHub Pages

For the Zola cutover, retain `gdario.dev` in the repository's Pages custom domain settings and set the Pages source to **GitHub Actions**. The workflow checks pull requests and builds and deploys pushes to `master`.
