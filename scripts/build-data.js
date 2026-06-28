const fs = require('fs')
const path = require('path')

const componentsDir = path.join(__dirname, '..', 'src', 'data', 'components')
const outputPath = path.join(__dirname, '..', 'src', 'data', 'components.json')

function extractCSS(html) {
  const match = html.match(/^<style>([\s\S]*?)<\/style>\s*([\s\S]*)$/i)
  if (match) return { css: match[1].trim(), body: match[2].trim() }
  return { css: '', body: html }
}

if (!fs.existsSync(componentsDir)) {
  console.log('Components directory not found.')
  process.exit(1)
}

const catDirs = fs.readdirSync(componentsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)

const categories = {}

for (const catDir of catDirs) {
  const dirPath = path.join(componentsDir, catDir)
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.html')).sort()
  const items = []

  for (const file of files) {
    const rawContent = fs.readFileSync(path.join(dirPath, file), 'utf-8')
    const { css, body } = extractCSS(rawContent)
    const name = file.replace(/\.html$/i, '').replace(/^\d+-/, '').replace(/[-_]/g, ' ')

    items.push({
      componentName: name,
      type: catDir,
      html: body,
      css,
      description: 'A ' + catDir.slice(0, -1) + ' component from ' + file,
      source: catDir,
    })
  }

  if (items.length > 0) {
    categories[catDir] = { items }
  }
}

const output = { categories }

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(output))
const total = Object.values(categories).reduce(function(a, c) { return a + c.items.length }, 0)
const cssSize = Object.values(categories).reduce(function(a, c) {
  return a + c.items.reduce(function(a2, i) { return a2 + (i.css || '').length }, 0)
}, 0)
console.log('Built ' + total + ' components into ' + outputPath)
console.log('Total CSS: ' + cssSize + ' chars')
