# 🪡 threadbare

A Twitter thread scraper CLI that works from the bottom up. 👆

## Commands

### Authentication

TODO: token process with links to Twitter docs

### `scrape`

Scrapes thread and saves it to a JSON file. **Must be given the ID for the last tweet in the thread.**
This scraper works by following the replied to property back up the thread.

**Name:** `scrape`

**Alias:** `s`

**Options:**

- `--name` (`-n`): filename for JSON file. Defaults to the tweet ID.

**Examples**

Will write to `1475991326554472448.json`.

```bash
threadbare scrape 1475991326554472448
# or with the alias
threadbare s 1475991326554472448
```

Will write to `2021Recap.json`.

```bash
 threadbare scrape 1475991326554472448 --name 2021Recap
 # or with the alias
 threadbare scrape 1475991326554472448 -n 2021Recap
```

### `generate`

Generates a view from a given scrapped JSON file.

**Name:** `generate`

**Alias:** `g`

**Options:**

- `--lang` (`-l`): the [`lang`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang) attribute for HTML. Defaults to `en`.
- `--type` (`-t`): the type of view to generate, must be either `pages` or `scroll`. Defaults to `pages`.

**Examples**

Will generate a pages view from `2021Recap.json`.

```bash
 threadbare generate 2021Recap.json
 # or with the alias
 threadbare g 2021Recap.json
 # or with pages set specifically
 threadbare generate 2021Recap.json --type pages
```

Will generate a scroll view.

```bash
 threadbare generate 2021Recap.json --type scroll
 # or with the alias
 threadbare generate 2021Recap.json -t scroll
```

# License

MIT - see LICENSE
