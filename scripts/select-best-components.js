const fs = require('fs')
const path = require('path')

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'components.json')))
const categories = data.categories || data
const sourceCSS = data.sourceCSS || {}

const OUT = path.join(__dirname, '..', 'src', 'data', 'components')
const MAX_PER_CATEGORY = 10

// Utility: how "interesting" a component is for visual display
function scoreComponent(comp) {
  let score = 0
  const html = comp.html || ''
  const css = sourceCSS[comp.source] || ''
  const name = comp.componentName || ''

  // Has substantial CSS
  if (css.length > 200) score += 20
  if (css.length > 500) score += 15
  if (css.length > 1000) score += 10

  // Has visual class names
  const visualKeywords = ['gradient', 'glass', 'neon', 'glow', 'shadow', 'blur', 'dark', 'light',
    'animated', 'float', '3d', 'perspective', 'shine', 'metallic', 'frost', 'translucent',
    'vibrant', 'cyber', 'retro', 'modern', 'sleek', 'minimal', 'glassmorphism', 'neubrutalism']
  for (const kw of visualKeywords) {
    if (html.toLowerCase().includes(kw)) score += 8
    if (css.toLowerCase().includes(kw)) score += 5
  }

  // Has unique class names (not just utility classes)
  const classAttrs = html.match(/class="([^"]*)"/g)
  if (classAttrs) {
    for (const ca of classAttrs) {
      const classes = ca.replace(/class="/, '').replace('"', '').split(/\s+/)
      const nonUtility = classes.filter(c =>
        c.length > 2 &&
        !['flex','grid','block','w-','h-','p-','m-','gap-','text-','bg-','border-',
          'rounded','shadow','items','justify','relative','absolute','fixed',
          'hidden','overflow','z-','opacity','transition','duration','ease',
          'font-','leading-','tracking-'].some(p => c.startsWith(p))
      )
      score += nonUtility.length * 3
    }
  }

  // Has meaningful name
  if (name && name.length > 3 && !name.startsWith('button-') && !name.startsWith('div-')) score += 5

  // HTML length is good (not too short, not too long after truncation)
  if (html.length > 100) score += 5
  if (html.length > 200) score += 3

  // Has CSS with visual properties
  if (/background|color|border|box-shadow|transform|animation/i.test(css)) score += 8
  if (/@keyframes/i.test(css)) score += 5

  return score
}

// Deduplicate by HTML content
function deduplicate(comps) {
  const seen = new Set()
  return comps.filter(c => {
    const key = (c.html || '').slice(0, 100)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

let totalSaved = 0

for (const [category, comps] of Object.entries(categories)) {
  if (!comps || comps.length === 0) continue

  const catDir = path.join(OUT, category)
  fs.mkdirSync(catDir, { recursive: true })

  // Deduplicate and score
  const unique = deduplicate(comps)
  const scored = unique
    .map(c => ({ ...c, score: scoreComponent(c) }))
    .sort((a, b) => b.score - a.score)

  // Pick top 10
  const picked = scored.slice(0, MAX_PER_CATEGORY)

  // If we have fewer than 10, still use what we have
  if (picked.length < Math.min(MAX_PER_CATEGORY, comps.length)) {
    console.log(`${category}: only ${picked.length} good components out of ${comps.length}`)
  }

  let idx = 1
  for (const comp of picked) {
    const css = sourceCSS[comp.source] || ''
    const name = comp.componentName || `component-${idx}`
    // Sanitize name for filename
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
    const filename = `${String(idx).padStart(2, '0')}-${safeName}.html`
    const filePath = path.join(catDir, filename)

    // Create self-contained HTML: <style> + HTML
    const fullHtml = css
      ? `<style>\n${css}\n</style>\n${comp.html || ''}`
      : comp.html || ''

    fs.writeFileSync(filePath, fullHtml)
    idx++
    totalSaved++
  }

  console.log(`${category}: saved ${picked.length} components to ${catDir}`)
}

console.log(`\nTotal saved: ${totalSaved} component files`)
console.log(`Location: ${OUT}`)
