# create-yoki-plugin

Scaffold a new [Yoki](https://yoki.run) plugin in seconds.

## Usage

```bash
npm init yoki-plugin
```

Or:

```bash
npx create-yoki-plugin
npx create-yoki-plugin my-plugin
```

## What it does

Interactive CLI that generates a ready-to-go plugin with:

- `plugin.json` — manifest with JSON Schema for IDE autocomplete
- `main.js` or `main.py` — starter code with SDK imports
- `.gitignore`, `README.md`, `package.json` (JS only)

## Options

| Prompt | Description |
|--------|-------------|
| Directory name | Folder name for the plugin |
| Display name | Human-readable name |
| Keyword | Trigger word in Yoki search |
| Description | What the plugin does |
| Language | JavaScript or Python |
| Mode | detail, list, or background |
| Category | marketplace category |

## Generated structure

```
my-plugin/
  plugin.json       ← manifest with $schema
  main.js           ← your plugin (or main.py)
  package.json      ← npm config (JS only)
  .gitignore
  README.md
```

## Test locally

```bash
echo '{"query":"test","command":"main","context":{}}' | node main.js
```

## Docs

- [Plugin Guide](https://github.com/xssmusashi/yoki/blob/main/plugins-guide.md)
- [@yoki/plugin-sdk](https://github.com/xssmusashi/yoki-plugin-sdk)
