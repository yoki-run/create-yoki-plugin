#!/usr/bin/env node
/**
 * create-yoki-plugin — scaffold a new Yoki plugin.
 *
 * Usage:
 *   npm init yoki-plugin
 *   npx create-yoki-plugin
 *   npx create-yoki-plugin my-plugin
 */
"use strict"

const fs = require("fs")
const path = require("path")
const readline = require("readline")

const SCHEMA_URL = "https://raw.githubusercontent.com/xssmusashi/yoki/main/plugin.schema.json"

// ---- Interactive prompts (pure stdlib, no dependencies) ----

function ask(rl, question, defaultVal) {
  const suffix = defaultVal ? ` (${defaultVal})` : ""
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultVal || "")
    })
  })
}

function choose(rl, question, options, defaultIdx) {
  return new Promise((resolve) => {
    console.log(`\n${question}`)
    options.forEach((opt, i) => {
      const marker = i === defaultIdx ? "●" : "○"
      console.log(`  ${marker} ${i + 1}) ${opt}`)
    })
    rl.question(`Choose [${defaultIdx + 1}]: `, (answer) => {
      const idx = parseInt(answer) - 1
      resolve(idx >= 0 && idx < options.length ? idx : defaultIdx)
    })
  })
}

// ---- Templates ----

function pluginJson(opts) {
  const manifest = {
    $schema: SCHEMA_URL,
    name: opts.name,
    keyword: opts.keyword,
    icon: opts.icon,
    description: opts.description,
    version: "1.0.0",
    author: opts.author,
    license: "MIT",
    categories: [opts.category],
    yoki_min: "1.0.4.0",
    protocol: "v2",
    permissions: {},
    commands: [
      {
        name: "main",
        title: opts.name,
        description: opts.description,
        mode: opts.mode,
        exec: `main${opts.ext}`,
        takes_query: true,
      },
    ],
  }
  return JSON.stringify(manifest, null, 2) + "\n"
}

function jsMain(opts) {
  if (opts.mode === "detail") {
    return `#!/usr/bin/env node
"use strict"

const { readInput, writeResponse, detail, error, escHtml } = require("@yoki/plugin-sdk")

async function main() {
  const input = await readInput()
  const query = input.query || ""

  if (!query) {
    writeResponse(detail(
      \`<div style="font-family:monospace;padding:16px">
        <h2 style="margin:0 0 12px">${opts.name}</h2>
        <p style="color:#888">${opts.description}</p>
        <p style="margin-top:8px">Type <code>${opts.keyword} &lt;query&gt;</code> to get started</p>
      </div>\`
    ))
    return
  }

  try {
    const result = \`You typed: \${query}\`

    writeResponse(detail(
      \`<div style="font-family:monospace;padding:16px">
        <div style="font-size:14px;color:#888;margin-bottom:8px">\${escHtml(query)}</div>
        <div style="font-size:24px;font-weight:bold;color:#4FC3F7">\${escHtml(result)}</div>
      </div>\`,
      [{ label: "Input", value: query }],
      [{ title: "Copy", type: "copy", value: result }]
    ))
  } catch (err) {
    writeResponse(error("Error", err.message))
  }
}

main()
`
  }

  if (opts.mode === "list") {
    return `#!/usr/bin/env node
"use strict"

const { readInput, writeResponse, list } = require("@yoki/plugin-sdk")

async function main() {
  const input = await readInput()
  const query = (input.query || "").toLowerCase()

  const allItems = [
    { id: "1", title: "First item", subtitle: "Description of first item" },
    { id: "2", title: "Second item", subtitle: "Description of second item" },
    { id: "3", title: "Third item", subtitle: "Description of third item" },
  ]

  const filtered = query
    ? allItems.filter(i => i.title.toLowerCase().includes(query))
    : allItems

  writeResponse(list(filtered.map(item => ({
    ...item,
    icon: "${opts.icon}",
    actions: [
      { title: "Copy", shortcut: "enter", type: "copy", value: item.title },
    ],
  }))))
}

main()
`
  }

  // background
  return `#!/usr/bin/env node
"use strict"

const { readInput, writeResponse, background, error } = require("@yoki/plugin-sdk")

async function main() {
  const input = await readInput()
  const query = input.query || ""

  if (!query) {
    writeResponse(error("No input", "Usage: ${opts.keyword} <query>"))
    return
  }

  // Do your side-effect here
  writeResponse(background(\`Done: \${query}\`))
}

main()
`
}

function pyMain(opts) {
  return `#!/usr/bin/env python3
"""${opts.name} — ${opts.description}"""

import sys
import json

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass


def read_input():
    try:
        raw = sys.stdin.read()
        return json.loads(raw) if raw.strip() else {}
    except Exception:
        return {}


def write_response(resp):
    json.dump(resp, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\\n")
    sys.stdout.flush()


def detail(markdown, metadata=None, actions=None):
    out = {"type": "detail", "markdown": markdown}
    if metadata:
        out["metadata"] = metadata
    if actions:
        out["actions"] = actions
    return out


def list_response(items):
    return {"type": "list", "items": items}


def background(hud, notification=None):
    out = {"type": "background", "hud": hud}
    if notification:
        out["notification"] = notification
    return out


def error(msg, details=None):
    out = {"type": "error", "error": msg}
    if details:
        out["details"] = details
    return out


def main():
    inp = read_input()
    query = inp.get("query", "")

    if not query:
        write_response(detail(
            '<div style="font-family:monospace;padding:16px">'
            '<h2 style="margin:0 0 12px">${opts.name}</h2>'
            '<p style="color:#888">${opts.description}</p>'
            '<p style="margin-top:8px">Type <code>${opts.keyword} &lt;query&gt;</code></p>'
            "</div>"
        ))
        return

    result = f"You typed: {query}"
    write_response(detail(
        f'<div style="font-family:monospace;padding:16px">'
        f'<div style="font-size:24px;font-weight:bold;color:#4FC3F7">{result}</div>'
        f"</div>",
        [{"label": "Input", "value": query}],
        [{"title": "Copy", "type": "copy", "value": result}],
    ))


main()
`
}

function gitignore() {
  return `node_modules/
data/
dist/
.DS_Store
`
}

function readmeTemplate(opts) {
  return `# ${opts.dirName}

${opts.description}

## Install

\`\`\`bash
git clone <repo-url> ~/yoki/plugins/${opts.dirName}
${opts.lang === "js" ? "npm install  # if using @yoki/plugin-sdk" : "# No dependencies needed"}
\`\`\`

Requires: **Yoki >= 1.0.4.0**${opts.lang === "js" ? ", **Node.js >= 14**" : ", **Python 3.8+**"}

## Usage

\`\`\`
${opts.keyword} <query>
\`\`\`
`
}

// ---- Main ----

async function main() {
  console.log("\n  create-yoki-plugin\n")
  console.log("  Scaffold a new Yoki plugin in seconds.\n")

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const arg = process.argv[2]

  const dirName = arg || await ask(rl, "Plugin directory name", "my-plugin")
  const name = await ask(rl, "Display name", dirName.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()))
  const keyword = await ask(rl, "Keyword (trigger word)", dirName.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 8))
  const description = await ask(rl, "Description", `A Yoki plugin`)
  const author = await ask(rl, "Author", "")
  const icon = await ask(rl, "Icon (emoji or name)", "🔌")

  const langIdx = await choose(rl, "Language:", ["JavaScript (Node.js)", "Python"], 0)
  const lang = langIdx === 0 ? "js" : "py"
  const ext = lang === "js" ? ".js" : ".py"

  const modeIdx = await choose(rl, "Default mode:", ["detail (rich card)", "list (searchable items)", "background (side-effect)"], 0)
  const modes = ["detail", "list", "background"]
  const mode = modes[modeIdx]

  const catIdx = await choose(rl, "Category:", ["productivity", "tools", "media", "developer", "utilities", "fun"], 1)
  const cats = ["productivity", "tools", "media", "developer", "utilities", "fun"]
  const category = cats[catIdx]

  rl.close()

  const opts = { name, keyword, description, author, icon, lang, ext, mode, category, dirName }

  // Create directory
  const dir = path.resolve(dirName)
  if (fs.existsSync(dir)) {
    console.error(`\n  Error: directory '${dirName}' already exists.\n`)
    process.exit(1)
  }

  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, "plugin.json"), pluginJson(opts))
  fs.writeFileSync(path.join(dir, `main${ext}`), lang === "js" ? jsMain(opts) : pyMain(opts))
  fs.writeFileSync(path.join(dir, ".gitignore"), gitignore())
  fs.writeFileSync(path.join(dir, "README.md"), readmeTemplate(opts))

  if (lang === "js") {
    const pkg = {
      name: dirName,
      version: "1.0.0",
      private: true,
      dependencies: { "@yoki/plugin-sdk": "^1.0.0" },
    }
    fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n")
  }

  console.log(`
  Plugin created in ./${dirName}/

  Files:
    plugin.json       manifest with JSON Schema
    main${ext}${" ".repeat(14 - ext.length)}your plugin code
    .gitignore        standard ignores
    README.md         documentation${lang === "js" ? "\n    package.json       npm config with @yoki/plugin-sdk" : ""}

  Next steps:
    1. ${lang === "js" ? `cd ${dirName} && npm install` : `cd ${dirName}`}
    2. Edit main${ext} with your logic
    3. Copy to ~/yoki/plugins/${dirName}
    4. Type '${keyword}' in Yoki to test

  Test locally:
    echo '{"query":"test","command":"main","context":{}}' | ${lang === "js" ? "node" : "python"} main${ext}

  Docs: https://github.com/xssmusashi/yoki/blob/main/plugins-guide.md
`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
