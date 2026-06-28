import { useState, useMemo, useRef, useEffect, memo } from 'react'
import { createPortal } from 'react-dom'
import { useDrag } from 'react-dnd'
import { useAppStore, TOOLS } from '../../store'
import { ComponentItem, CanvasElement, SavedImport } from '../../types'
import ComponentPreview from '../common/ComponentPreview'
import ImportModal from '../ImportModal/ImportModal'
import './Sidebar.css'

interface DraggableProps {
  component: ComponentItem;
  onClick: (c: ComponentItem) => void;
  onShowPreview: (c: ComponentItem, rect: DOMRect) => void;
  onMovePreview: (rect: DOMRect) => void;
  onHidePreview: () => void;
}

const DraggableComponent = memo(({ component, onClick, onShowPreview, onMovePreview, onHidePreview }: DraggableProps) => {
  const [, drag] = useDrag(() => ({
    type: 'COMPONENT',
    item: () => {
      const newEl: CanvasElement = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        componentId: component.id,
        x: 0, y: 0,
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
      return newEl
    },
  }))
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const localTarget = useRef<HTMLElement | null>(null)

  useEffect(() => () => { if (localTimer.current) clearTimeout(localTimer.current) }, [])

  return (
    <div ref={drag} className="sidebar-component" onClick={() => onClick(component)}
      draggable={false}
      onDragStart={e => e.preventDefault()}
      onPointerEnter={(e) => {
        if (localTimer.current) clearTimeout(localTimer.current)
        const target = e.currentTarget as HTMLElement
        localTarget.current = target
        localTimer.current = setTimeout(() => {
          if (localTarget.current === target) {
            const rect = target.getBoundingClientRect()
            onShowPreview(component, rect)
          }
        }, 200)
      }}
      onPointerMove={() => {
        if (localTarget.current) {
          const rect = localTarget.current.getBoundingClientRect()
          onMovePreview(rect)
        }
      }}
      onPointerLeave={() => {
        if (localTimer.current) clearTimeout(localTimer.current)
        onHidePreview()
      }}
    >
      <span className="component-name">{component.name}</span>
      <span className="component-type">{component.type}</span>
    </div>
  )
})

function SidebarComponent() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showImport, setShowImport] = useState(false)
  const hoverTimeRef = useRef(0)
  const categories = useAppStore((s) => s.categories)
  const addCanvasElement = useAppStore((s) => s.addCanvasElement)
  const selectElement = useAppStore((s) => s.selectElement)
  const [hoveredComponent, setHoveredComponent] = useState<ComponentItem | null>(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })

  // Force hide hover preview after 2.5s regardless of mouse position
  useEffect(() => {
    const iv = setInterval(() => {
      if (hoveredComponent && Date.now() - hoverTimeRef.current > 1000) {
        setHoveredComponent(null)
      }
    }, 500)
    return () => clearInterval(iv)
  }, [hoveredComponent])

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.toLowerCase()
    return categories
      .map((cat) => ({
        ...cat,
        components: cat.components.filter(
          (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.components.length > 0)
  }, [search, categories])

  const toggleCategory = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const canvasElements = useAppStore((s) => s.canvasElements)
  const addConnection = useAppStore((s) => s.addConnection)

  const handleComponentClick = (component: ComponentItem) => {
    const newEl: CanvasElement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      componentId: component.id,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 360,
      height: 240,
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
    const currentEls = canvasElements
    if (currentEls.length > 0) {
      addConnection({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        fromId: currentEls[currentEls.length - 1].id,
        toId: newEl.id,
      })
    }
    selectElement(newEl.id)
  }

  const handleShowPreview = (component: ComponentItem, rect: DOMRect) => {
    setHoverPos({ x: rect.right + 12, y: rect.top })
    hoverTimeRef.current = Date.now()
    setHoveredComponent(component)
  }

  const handleMovePreview = (rect: DOMRect) => {
    setHoverPos(p =>
      p.x === rect.right + 12 && p.y === rect.top ? p : { x: rect.right + 12, y: rect.top }
    )
  }

  const handleHidePreview = () => {
    hoverTimeRef.current = Date.now()
  }

  const savedImports = useAppStore((s) => s.savedImports)
  const deleteSavedImport = useAppStore((s) => s.deleteSavedImport)

  const handleImportClick = (imp: SavedImport) => {
    const newEl: CanvasElement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      componentId: 'saved-' + imp.id,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 360,
      height: 240,
      name: imp.name,
      category: 'My Imports',
      type: 'import',
      html: imp.html,
      css: imp.css,
      js: imp.js,
      description: `Saved import (${imp.source})`,
      source: imp.source,
      mode: 'source',
    }
    addCanvasElement(newEl)
    const currentEls = canvasElements
    if (currentEls.length > 0) {
      addConnection({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        fromId: currentEls[currentEls.length - 1].id,
        toId: newEl.id,
      })
    }
    selectElement(newEl.id)
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">My Awesome</h1>
        <span className="sidebar-author">by Yasser-27</span>
      </div>
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="sidebar-categories">
        {filteredCategories.map((category) => (
          <div key={category.name} className="category-group">
            <div className="category-header" onClick={() => toggleCategory(category.name)}>
              
              <span className="category-name">{category.name}</span>
              <span className="category-count">{category.components.length}</span>
              <span className={`category-arrow ${expanded[category.name] ? 'expanded' : ''}`}>{'>'}</span>
            </div>
            {expanded[category.name] && (
              <div className="category-components">
                {category.components.map((component) => (
                  <DraggableComponent key={component.id} component={component}
                    onClick={handleComponentClick}
                    onShowPreview={handleShowPreview}
                    onMovePreview={handleMovePreview}
                    onHidePreview={handleHidePreview}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Tools section */}
      <div className="sidebar-tools">
        <div className="sidebar-tools-header">
          <span className="sidebar-tools-title">Tools</span>
        </div>
        {TOOLS.map((tool) => (
          <div key={tool.name} className="sidebar-tool-item"
            onClick={() => useAppStore.getState().setActiveTool(tool.name)}
          >
            <span className="sidebar-tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="14" height="14" fill="currentColor"><path d="M598.6 118.6C611.1 106.1 611.1 85.8 598.6 73.3C586.1 60.8 565.8 60.8 553.3 73.3L361.3 265.3L326.6 230.6C322.4 226.4 316.6 224 310.6 224C298.1 224 288 234.1 288 246.6L288 275.7L396.3 384L425.4 384C437.9 384 448 373.9 448 361.4C448 355.4 445.6 349.6 441.4 345.4L406.7 310.7L598.7 118.7zM373.1 417.4L254.6 298.9C211.9 295.2 169.4 310.6 138.8 341.2L130.8 349.2C108.5 371.5 96 401.7 96 433.2C96 440 103.1 444.4 109.2 441.4L160.3 415.9C165.3 413.4 169.8 420 165.7 423.8L39.3 537.4C34.7 541.6 32 547.6 32 553.9C32 566.1 41.9 576 54.1 576L227.4 576C266.2 576 303.3 560.6 330.8 533.2C361.4 502.6 376.7 460.1 373.1 417.4z"/></svg>
            </span>
            <span className="sidebar-tool-label">{tool.label}</span>
          </div>
        ))}
      </div>

      {savedImports.length > 0 && (
        <div className="sidebar-imports">
          <div className="sidebar-tools-header">
            <span className="sidebar-tools-title">My Imports</span>
          </div>
          {savedImports.map((imp) => (
            <div key={imp.id} className="sidebar-import-item" onClick={() => handleImportClick(imp)}
              title={`${imp.name} (${imp.source})`}>
              <span className="sidebar-import-item-name">{imp.name}</span>
              <span className="sidebar-import-item-source">{imp.source}</span>
              <span className="sidebar-import-item-del" onClick={e => { e.stopPropagation(); deleteSavedImport(imp.id) }}>✕</span>
            </div>
          ))}
        </div>
      )}

      {/* Import Design */}
      <div className="sidebar-import">
        <div className="sidebar-import-btn" onClick={() => setShowImport(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="14" height="14" fill="currentColor"><path d="M480 400L288 400C279.2 400 272 392.8 272 384L272 128C272 119.2 279.2 112 288 112L421.5 112C425.7 112 429.8 113.7 432.8 116.7L491.3 175.2C494.3 178.2 496 182.3 496 186.5L496 384C496 392.8 488.8 400 480 400zM288 448L480 448C515.3 448 544 419.3 544 384L544 186.5C544 169.5 537.3 153.2 525.3 141.2L466.7 82.7C454.7 70.7 438.5 64 421.5 64L288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L368 496L368 512C368 520.8 360.8 528 352 528L160 528C151.2 528 144 520.8 144 512L144 256C144 247.2 151.2 240 160 240L176 240L176 192L160 192z"/></svg>
          <span>Import Design</span>
        </div>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}

      {/* Hover preview tooltip — rendered at root via portal to avoid overflow clipping */}
      {hoveredComponent && createPortal(
        <div
          className="sidebar-hover-preview"
          style={{
            position: 'fixed',
            left: Math.min(hoverPos.x, window.innerWidth - 210),
            top: Math.min(hoverPos.y, window.innerHeight - 130),
            zIndex: 99999,
            width: 200,
            height: 120,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ padding: '4px 8px', fontSize: 10, color: '#aaa', borderBottom: '1px solid #2a2a2a', background: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hoveredComponent.name}
          </div>
          <div style={{ height: 82, overflow: 'hidden', padding: 4 }}>
            <ComponentPreview html={hoveredComponent.html} css={hoveredComponent.css} maxHeight={82} />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default SidebarComponent

