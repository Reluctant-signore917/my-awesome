import { useEffect, useRef, useState, useCallback, useLayoutEffect, memo } from 'react'
import { useDrop } from 'react-dnd'
import { useAppStore, GRID_SIZE, snapToGrid, TOOLS } from '../../store'
import { CanvasElement as CanvasElementType } from '../../types'
import ComponentPreview from '../common/ComponentPreview'
import colorPaletteHtml from '../../data/tools/color-palette.html?raw'
import textGradientHtml from '../../data/tools/text-gradient-generator.html?raw'
import meshGradientHtml from '../../data/tools/mesh-gradient-generator.html?raw'
import uiStudioHtml from '../../data/tools/awsome_desinger.html?raw'

const toolHtmlMap: Record<string, string> = {
  'color-palette': colorPaletteHtml,
  'text-gradient': textGradientHtml,
  'mesh-gradient': meshGradientHtml,
  'ui-studio': uiStudioHtml,
}

const NODE_W = 280
const NODE_H = 200
const ANCHOR_R = 6

const CanvasNode = memo(({
  id, x, y, name, html, css, category, zoom, cam,
  isSelected, isHovered,
  onMouseDown, onMouseEnter, onMouseLeave,
}: {
  id: string; x: number; y: number; name: string;
  html: string; css: string; category: string;
  zoom: number; cam: { x: number; y: number };
  isSelected: boolean; isHovered: boolean;
  onMouseDown: (e: React.MouseEvent, id: string, x: number, y: number) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: (id: string) => void;
}) => {
  const showAnchors = isHovered || isSelected
  return (
    <div
      draggable={false}
      className="absolute overflow-hidden select-none"
      style={{
        left: x * zoom + cam.x, top: y * zoom + cam.y,
        transform: 'scale(' + zoom + ')', transformOrigin: 'top left',
        width: NODE_W,
        background: 'linear-gradient(0deg, #000, #161617)',
        borderRadius: 12,
        border: isSelected ? '1.5px solid #00DDEB' : '1px solid #2a2a2a',
        boxShadow: isSelected ? '0 0 20px rgba(0,221,235,0.25)' : '0 2px 8px rgba(0,0,0,0.15)',
        cursor: 'move',
        transition: 'border-color .2s, box-shadow .2s',
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseEnter={() => onMouseEnter(id)}
      onMouseLeave={() => onMouseLeave(id)}
      onMouseDown={e => onMouseDown(e, id, x, y)}
      onDragStart={e => e.preventDefault()}
    >
      <div className="flex items-center px-3 py-2 gap-2" style={{ borderBottom: '1px solid #2a2a2a' }}>
        <span className="flex-1 text-xs font-medium truncate" style={{ color: '#e0e0e0' }}>{name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#2a2a2a', color: '#888' }}>{category}</span>
      </div>
      <div style={{ height: NODE_H - 36, overflow: 'hidden' }}>
        <ComponentPreview html={html} css={css} maxHeight={NODE_H - 36} />
      </div>

      {showAnchors && <>
        <div className="pointer-events-none absolute" style={{ left: '50%', top: -ANCHOR_R, marginLeft: -ANCHOR_R, width: ANCHOR_R * 2, height: ANCHOR_R * 2, borderRadius: '50%', background: isHovered ? '#00DDEB' : '#4a4a4a', border: '1px solid', borderColor: isHovered ? '#00DDEB' : '#666', zIndex: 20 }} />
        <div className="pointer-events-none absolute" style={{ left: '50%', bottom: -ANCHOR_R, marginLeft: -ANCHOR_R, width: ANCHOR_R * 2, height: ANCHOR_R * 2, borderRadius: '50%', background: isHovered ? '#00DDEB' : '#4a4a4a', border: '1px solid', borderColor: isHovered ? '#00DDEB' : '#666', zIndex: 20 }} />
        <div className="pointer-events-none absolute" style={{ top: '50%', left: -ANCHOR_R, marginTop: -ANCHOR_R, width: ANCHOR_R * 2, height: ANCHOR_R * 2, borderRadius: '50%', background: isHovered ? '#00DDEB' : '#4a4a4a', border: '1px solid', borderColor: isHovered ? '#00DDEB' : '#666', zIndex: 20 }} />
        <div className="pointer-events-none absolute" style={{ top: '50%', right: -ANCHOR_R, marginTop: -ANCHOR_R, width: ANCHOR_R * 2, height: ANCHOR_R * 2, borderRadius: '50%', background: isHovered ? '#00DDEB' : '#4a4a4a', border: '1px solid', borderColor: isHovered ? '#00DDEB' : '#666', zIndex: 20 }} />
      </>}
    </div>
  )
})

function Canvas() {
  const canvasElements = useAppStore((s) => s.canvasElements)
  const connections = useAppStore((s) => s.connections)
  const addCanvasElement = useAppStore((s) => s.addCanvasElement)
  const addConnection = useAppStore((s) => s.addConnection)
  const removeCanvasElement = useAppStore((s) => s.removeCanvasElement)
  const selectElement = useAppStore((s) => s.selectElement)
  const selectedElementId = useAppStore((s) => s.selectedElementId)
  const updateElementPosition = useAppStore((s) => s.updateElementPosition)
  const setTriggerGenerate = useAppStore((s) => s.setTriggerGenerate)
  const canvasMode = useAppStore((s) => s.canvasMode)
  const setCanvasMode = useAppStore((s) => s.setCanvasMode)
  const activeTool = useAppStore((s) => s.activeTool)
  const setActiveTool = useAppStore((s) => s.setActiveTool)
  const pushUndo = useAppStore((s) => s.pushUndo)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const elementsRef = useRef(canvasElements)
  elementsRef.current = canvasElements
  const [cam, setCam] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [drag, setDrag] = useState<{ t: string; sx?: number; sy?: number; id?: string; ox?: number; oy?: number } | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  const camRef = useRef(cam); camRef.current = cam
  const zoomRef = useRef(zoom); zoomRef.current = zoom

  const onCanvasDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'CANVAS') {
      setDrag({ t: 'c', sx: e.clientX - cam.x, sy: e.clientY - cam.y })
      selectElement(null)
    }
  }

  const onNodeDown = useCallback((e: React.MouseEvent, id: string, x: number, y: number) => {
    e.stopPropagation()
    const c = camRef.current
    const z = zoomRef.current
    const rect = containerRef.current!.getBoundingClientRect()
    setDrag({
      t: 'n', id,
      ox: (e.clientX - rect.left - c.x) / z - x,
      oy: (e.clientY - rect.top - c.y) / z - y,
    })
    selectElement(id)
  }, [selectElement])

  const onNodeEnter = useCallback((id: string) => {
    setHoveredNodeId(id)
  }, [])

  const onNodeLeave = useCallback((id: string) => {
    setHoveredNodeId(h => h === id ? null : h)
  }, [])

  const positionsRef = useRef(canvasElements.map(e => ({ id: e.id, x: e.x, y: e.y })))
  positionsRef.current = canvasElements.map(e => ({ id: e.id, x: e.x, y: e.y }))

  useEffect(() => {
    const mv = (e: MouseEvent) => {
      if (!drag) return
      if (drag.t === 'c') {
        setCam({ x: e.clientX - drag.sx!, y: e.clientY - drag.sy! })
      } else if (drag.t === 'n') {
        const c = camRef.current
        const z = zoomRef.current
        const rect = containerRef.current!.getBoundingClientRect()
        const nx = (e.clientX - rect.left - c.x) / z - drag.ox!
        const ny = (e.clientY - rect.top - c.y) / z - drag.oy!
        updateElementPosition(drag.id!, nx, ny)
        drawRef.current()
      }
    }
    const up = () => {
      if (drag?.t === 'n') pushUndo()
      setDrag(null)
    }
    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
  }, [drag, updateElementPosition, pushUndo])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const wh = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey) {
        const rect = el.getBoundingClientRect()
        const mx = e.clientX - rect.left, my = e.clientY - rect.top
        const old = zoom
        const nz = Math.max(0.1, Math.min(5, zoom * (e.deltaY < 0 ? 1.1 : 0.9)))
        setCam({ x: mx - (mx - cam.x) * (nz / old), y: my - (my - cam.y) * (nz / old) })
        setZoom(nz)
      } else setCam(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
    }
    el.addEventListener('wheel', wh, { passive: false })
    return () => el.removeEventListener('wheel', wh)
  }, [zoom, cam])

  useEffect(() => {
    const handleF7 = (e: KeyboardEvent) => { if (e.key === 'F7') { e.preventDefault(); setTriggerGenerate(true) } }
    window.addEventListener('keydown', handleF7)
    return () => window.removeEventListener('keydown', handleF7)
  }, [setTriggerGenerate])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedElementId) {
        pushUndo()
        removeCanvasElement(selectedElementId)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (e.key === 'Tab') {
        const el = document.activeElement
        if (el && el.closest('.generate-window')) return
        e.preventDefault()
        setCanvasMode(canvasMode === 'source' ? 'description' : 'source')
        return
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, removeCanvasElement, pushUndo, undo, redo, setCanvasMode, canvasMode])

  const [, drop] = useDrop(() => ({
    accept: 'COMPONENT',
    drop: (item: CanvasElementType, monitor) => {
      const offset = monitor.getClientOffset()
      if (!offset || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const c = camRef.current; const z = zoomRef.current
      const x = snapToGrid((offset.x - rect.left - c.x) / z - NODE_W / 2)
      const y = snapToGrid((offset.y - rect.top - c.y) / z - NODE_H / 2)
      const newEl: CanvasElementType = {
        ...item, x: Math.max(0, x), y: Math.max(0, y),
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        width: NODE_W, height: NODE_H,
      }
      pushUndo()
      addCanvasElement(newEl)
      const currentElements = elementsRef.current
      if (currentElements.length > 0) {
        addConnection({
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          fromId: currentElements[currentElements.length - 1].id,
          toId: newEl.id,
        })
      }
    },
  }), [addCanvasElement, addConnection, pushUndo])

  const setRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
    if (node) drop(node)
  }, [drop])

  const drawConnections = useCallback(() => {
    const cv = containerRef.current?.querySelector('canvas')
    if (!cv) return
    const ctx = (cv as HTMLCanvasElement).getContext('2d')
    if (!ctx) return
    const parent = containerRef.current!
    cv.width = parent.clientWidth
    cv.height = parent.clientHeight
    ctx.clearRect(0, 0, cv.width, cv.height)
    const elMap = new Map(positionsRef.current.map(p => [p.id, p]))
    connections.forEach(conn => {
      const a = elMap.get(conn.fromId)
      const b = elMap.get(conn.toId)
      if (!a || !b) return
      const x1 = a.x * zoom + cam.x + NODE_W * zoom / 2
      const y1 = a.y * zoom + cam.y + NODE_H * zoom / 2
      const x2 = b.x * zoom + cam.x + NODE_W * zoom / 2
      const y2 = b.y * zoom + cam.y + NODE_H * zoom / 2
      const g = ctx.createLinearGradient(x1, y1, x2, y2)
      g.addColorStop(0, '#AF40FF'); g.addColorStop(0.5, '#5B42F3'); g.addColorStop(1, '#00DDEB')
      ctx.beginPath(); ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.globalAlpha = 0.5
      const dx = x2 - x1; const cp = Math.abs(dx) * 0.4
      ctx.moveTo(x1, y1); ctx.bezierCurveTo(x1 + cp, y1, x2 - cp, y2, x2, y2)
      ctx.stroke(); ctx.globalAlpha = 1
      const angle = Math.atan2(y2 - y1, x2 - x1)
      ctx.beginPath(); ctx.fillStyle = '#00DDEB'
      const as = 8; const aa = 0.4
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - as * Math.cos(angle - aa), y2 - as * Math.sin(angle - aa))
      ctx.lineTo(x2 - as * Math.cos(angle + aa), y2 - as * Math.sin(angle + aa))
      ctx.closePath(); ctx.fill()
    })
  }, [connections, cam, zoom])

  const drawRef = useRef(drawConnections)
  drawRef.current = drawConnections

  useLayoutEffect(() => { drawConnections() }, [drawConnections])

  useEffect(() => {
    const parent = containerRef.current
    if (!parent) return
    const obs = new ResizeObserver(() => drawRef.current())
    obs.observe(parent)
    return () => obs.disconnect()
  }, [])

  // Tool iframe message listener
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!activeTool) return
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'tool-output') {
        const { html, css, name } = e.data
        if (!html) return
        const newEl: CanvasElementType = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          componentId: 'tool-' + activeTool,
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          width: 360,
          height: 240,
          name: name || e.data.toolName || activeTool,
          category: 'Tools',
          type: 'tool',
          html,
          css: css || '',
          description: `Generated from ${activeTool}`,
          source: 'tool',
          mode: 'source',
        }
        addCanvasElement(newEl)
        const current = useAppStore.getState().canvasElements
        const currentEls = current.filter(el => el.id !== newEl.id)
        if (currentEls.length > 0) {
          addConnection({
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
            fromId: currentEls[currentEls.length - 1].id,
            toId: newEl.id,
          })
        }
        selectElement(newEl.id)
        setActiveTool(null)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [activeTool])

  return (
    <div className="flex-1 flex flex-col relative" style={{ backgroundColor: '#161616', overflow: 'hidden' }}>
      <div className="flex items-center justify-between px-3 py-1.5 shrink-0"
        style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: '#888' }}>
            Canvas {canvasElements.length > 0 ? `\u2022 ${canvasElements.length} elements` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 mr-2" style={{ borderRight: '1px solid #333', paddingRight: 8 }}>
            <button onClick={() => setCanvasMode('source')}
              className="px-2 py-1 rounded text-[10px] border-none cursor-pointer font-medium"
              style={{ backgroundColor: canvasMode === 'source' ? '#333' : 'transparent', color: canvasMode === 'source' ? '#00c8ff' : '#888' }}
            >&lt;/&gt; Source</button>
            <button onClick={() => setCanvasMode('description')}
              className="px-2 py-1 rounded text-[10px] border-none cursor-pointer font-medium"
              style={{ backgroundColor: canvasMode === 'description' ? '#333' : 'transparent', color: canvasMode === 'description' ? '#00c8ff' : '#888' }}
            >(i) Designer</button>
          </div>
          <button onClick={() => setZoom(z => Math.min(5, z * 1.2))}
            className="w-6 h-6 rounded flex items-center justify-center text-[11px] border-none cursor-pointer"
            style={{ backgroundColor: 'transparent', color: '#aaa' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#333'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
          >+</button>
          <span className="text-[11px] min-w-[32px] text-center" style={{ color: '#888' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.1, z / 1.2))}
            className="w-6 h-6 rounded flex items-center justify-center text-[11px] border-none cursor-pointer"
            style={{ backgroundColor: 'transparent', color: '#aaa' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#333'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
          >-</button>
          <div className="text-[10px] ml-2 px-2 py-1 rounded" style={{ backgroundColor: '#2a2a2a', color: '#555' }}>F7</div>
        </div>
      </div>

      <div ref={setRef}
        className={'flex-1 relative ' + (drag?.t === 'c' ? 'cursor-grabbing' : 'cursor-grab')}
        onMouseDown={onCanvasDown}
      >
        <canvas className="absolute top-0 left-0 pointer-events-none" />

        {canvasElements.map(node => (
          <CanvasNode key={node.id}
            id={node.id} x={node.x} y={node.y}
            name={node.name} html={node.html} css={node.css || ''}
            category={node.category}
            zoom={zoom} cam={cam}
            isSelected={selectedElementId === node.id}
            isHovered={hoveredNodeId === node.id}
            onMouseDown={onNodeDown}
            onMouseEnter={onNodeEnter}
            onMouseLeave={onNodeLeave}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #2a2a2a 1px, transparent 1px)',
          backgroundSize: GRID_SIZE * zoom + 'px ' + GRID_SIZE * zoom + 'px',
          backgroundPosition: cam.x % (GRID_SIZE * zoom) + 'px ' + cam.y % (GRID_SIZE * zoom) + 'px',
          opacity: 0.3,
        }}
      />

      {/* Tool viewer overlay */}
      {activeTool && (() => {
        const toolDef = TOOLS.find(t => t.name === activeTool)
        const htmlContent = toolHtmlMap[activeTool]
        const toolLabel = toolDef?.label || activeTool
        return (
          <div className="absolute inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0d0f1a' }}>
            <div className="flex items-center justify-between px-4 py-2 shrink-0"
              style={{ backgroundColor: '#161b2e', borderBottom: '1px solid #2a3050' }}>
              <span className="text-sm font-medium" style={{ color: '#e8edf8' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="14" height="14" fill="currentColor" style={{marginRight:4}}><path d="M598.6 118.6C611.1 106.1 611.1 85.8 598.6 73.3C586.1 60.8 565.8 60.8 553.3 73.3L361.3 265.3L326.6 230.6C322.4 226.4 316.6 224 310.6 224C298.1 224 288 234.1 288 246.6L288 275.7L396.3 384L425.4 384C437.9 384 448 373.9 448 361.4C448 355.4 445.6 349.6 441.4 345.4L406.7 310.7L598.7 118.7zM373.1 417.4L254.6 298.9C211.9 295.2 169.4 310.6 138.8 341.2L130.8 349.2C108.5 371.5 96 401.7 96 433.2C96 440 103.1 444.4 109.2 441.4L160.3 415.9C165.3 413.4 169.8 420 165.7 423.8L39.3 537.4C34.7 541.6 32 547.6 32 553.9C32 566.1 41.9 576 54.1 576L227.4 576C266.2 576 303.3 560.6 330.8 533.2C361.4 502.6 376.7 460.1 373.1 417.4z"/></svg> {toolLabel}</span>
              <button onClick={() => setActiveTool(null)}
                className="px-3 py-1.5 rounded text-xs border-none cursor-pointer"
                style={{ backgroundColor: '#2a3050', color: '#c8d0e8' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#3a4570'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#2a3050'}
              >✕ Close</button>
            </div>
            {htmlContent ? (
              <iframe ref={iframeRef} srcDoc={htmlContent} className="flex-1 border-none w-full"
                style={{ backgroundColor: '#0d0f1a' }} />
            ) : (
              <div className="flex-1 flex items-center justify-center" style={{ color: '#6b7599', fontSize: 13 }}>
                Loading tool...
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

export default Canvas
