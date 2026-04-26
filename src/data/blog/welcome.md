---
title: Welcome — frontmatter reference
pubDatetime: 2026-04-26T09:00:00+09:00
description: A draft seed post showing every supported frontmatter field. Copy this file as a starting point for new posts.
draft: true
tags:
  - meta
# Optional fields (uncomment as needed):
# author: Ido                    # defaults to SITE.author
# modDatetime: 2026-04-27T10:00:00+09:00
# featured: true                 # pin to the home page
# ogImage: ./welcome-og.png      # local image or absolute URL; falls back to dynamic OG
# canonicalURL: https://example.com/original-post
# hideEditPost: true             # hide the "Edit page" link for this post
# timezone: Asia/Seoul           # overrides SITE.timezone for this post
---

이 파일은 새 글을 쓸 때 복사해서 쓰라고 만든 시드 포스트야. `draft: true`라 빌드 산출물에는 포함되지 않는다.

This is a seed post meant to be copied as a starting template. Because `draft: true` is set, it is excluded from the production build and post listings.

## Required fields

- `title` — post title (string)
- `pubDatetime` — ISO 8601 datetime; timezone offset matters for ordering
- `description` — used in meta tags and post cards

## Notes

- `tags` defaults to `["others"]` if omitted; lowercase, hyphenated.
- Filename becomes the slug: `welcome.md` → `/posts/welcome/`.
- Markdown supports remark TOC and collapsible sections via the configured plugins.
