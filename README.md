# 🪡 threadbare

A Twitter thread scraper CLI that works from the bottom up. 👆

## Commands

### Authentication

TODO: token process with links to Twitter docs

### `scrape`

Scrapes thread and saves it to a JSON file. **Must be given the ID for the last tweet in the thread.**

**Name:** `scrape`

**Alias:** `s`

**Options:**

- `--name` (`-n`): filename for JSON file

**Examples**

Will write to `1475991326554472448.json`.

```bash
threadbare scrape 1475991326554472448
# or
threadbare s 1475991326554472448
```

Will write to `2021Recap.json`.

```bash
 threadbare scrape 1475991326554472448 --name 2021Recap
 # or
 threadbare scrape 1475991326554472448 -n 2021Recap
```

### `generate`

Generates a view from a given scrapped JSON file.

**Name:** `generate`

**Alias:** `g`

**Options:**

- `--lang` (`-l`): the [`lang`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang) attribute for HTML, defaults to `en`

**Examples**

Will generate a view from `2021Recap.json`.

```bash
 threadbare generate 2021Recap.json
 # or
 threadbare g 2021Recap.json
```

# License

MIT - see LICENSE
