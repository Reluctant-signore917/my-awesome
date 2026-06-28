import { useState, useMemo } from 'react'
import { useDrag } from 'react-dnd'
import { useAppStore } from '../../store'
import { CanvasElement, ComponentItem } from '../../types'
import ComponentPreview from '../common/ComponentPreview'
import './ObjectPanel.css'

const categoryColors: Record<string, string> = {
  'Buttons': '#00c8ff', 'Bars': '#4caf50', 'Backgrounds': '#9c27b0',
  'Switch Buttons': '#ff9800', 'CSS Transitions': '#e91e63', 'Inputs': '#2196f3',
  'Cards': '#00bcd4', 'Skeletons': '#607d8b', 'Navigation': '#3f51b5',
  'Typography': '#673ab7', 'Media & Avatar': '#ff5722', 'Grids': '#009688',
  'Sidebars': '#795548', 'Tab Bar': '#03a9f4', 'Glass': '#00acc1',
  'Color Palettes': '#ff9800', 'Feedback': '#f44336', 'Status': '#8bc34a',
  'Layout': '#009688', 'Mobile UI': '#9c27b0', 'Dashboard': '#e91e63',
  'Code': '#4caf50', 'Data Display': '#607d8b', 'Dev UI': '#00bcd4',
}

function ObjectPanel() {
  const categories = useAppStore((s) => s.categories)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const allComponents = useMemo(() => categories.flatMap((c) => c.components), [categories])

  const filtered = useMemo(() => {
    let items = allComponents
    if (activeCategory) {
      items = items.filter((c) => c.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
      )
    }
    return items
  }, [allComponents, activeCategory, search])

  return (
    <div className="object-panel">
      <div className="op-controls">
        <input
          type="text"
          placeholder="Filter components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="op-search-input"
        />
        <div className="op-category-filter">
          <button
            className={`op-filter-btn ${!activeCategory ? 'active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              className={`op-filter-btn ${activeCategory === cat.name ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.name)}
              style={activeCategory === cat.name ? { borderColor: categoryColors[cat.name] || '#888', color: categoryColors[cat.name] || '#fff' } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      <div className="op-grid">
        {filtered.map((component) => (
          <DraggableComponentCard key={component.id} component={component} color={categoryColors[component.category] || '#888'} />
        ))}
        {filtered.length === 0 && (
          <div className="op-empty">No components found</div>
        )}
      </div>
    </div>
  )
}

function DraggableComponentCard({ component, color }: { component: ComponentItem; color: string }) {
  const addCanvasElement = useAppStore((s) => s.addCanvasElement)
  const selectElement = useAppStore((s) => s.selectElement)

  const [, drag] = useDrag(() => ({
    type: 'COMPONENT',
    item: () => {
      const newEl: CanvasElement = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        componentId: component.id,
        x: 200, y: 200, width: 360, height: 240,
        name: component.name,
        category: component.category,
        type: component.type,
        html: component.html,
        css: component.css,
        js: component.js,
        source: component.source,
        description: component.description,
        mode: 'source',
      }
      return newEl
    },
  }))

  const handleClick = () => {
    const newEl: CanvasElement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      componentId: component.id,
      x: 200 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      width: 360, height: 240,
      name: component.name,
      category: component.category,
      type: component.type,
      html: component.html,
      css: component.css,
      js: component.js,
      source: component.source,
      description: component.description,
      mode: 'source',
    }
    addCanvasElement(newEl)
    selectElement(newEl.id)
  }

  return (
    <div ref={drag} className="op-card" onClick={handleClick}>
      <div className="op-card-preview" style={{ borderColor: color }}>
        <ComponentPreview html={component.html} css={component.css} maxHeight={50} />
      </div>
      <div className="op-card-info">
        <span className="op-card-name">{component.name}</span>
        <span className="op-card-category" style={{ color }}>{component.category}</span>
      </div>
    </div>
  )
}

export default ObjectPanel
