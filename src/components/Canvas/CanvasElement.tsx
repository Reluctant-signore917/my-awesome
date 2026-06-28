import { useRef, useCallback, useState } from 'react'
import { useDrag } from 'react-dnd'
import { useAppStore } from '../../store'
import { CanvasElement } from '../../types'
import ComponentPreview from '../common/ComponentPreview'
import './CanvasElement.css'

interface Props {
  element: CanvasElement
  index: number
  isSelected: boolean
}

function CanvasElementComponent({ element, index, isSelected }: Props) {
  const updateCanvasElement = useAppStore((s) => s.updateCanvasElement)
  const removeCanvasElement = useAppStore((s) => s.removeCanvasElement)
  const selectElement = useAppStore((s) => s.selectElement)
  const canvasMode = useAppStore((s) => s.canvasMode)
  const ref = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement | null>
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0 })

  const [, drag] = useDrag(() => ({
    type: 'CANVAS_ELEMENT',
    item: { id: element.id },
  }), [element.id])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    selectElement(element.id)
    dragStart.current = { x: e.clientX, y: e.clientY, elX: element.x, elY: element.y }
    setIsDragging(true)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStart.current.x
      const dy = moveEvent.clientY - dragStart.current.y
      updateCanvasElement(element.id, {
        x: dragStart.current.elX + dx,
        y: dragStart.current.elY + dy,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [element.id, element.x, element.y, selectElement, updateCanvasElement])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    removeCanvasElement(element.id)
  }, [element.id, removeCanvasElement])

  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    selectElement(element.id)
  }, [element.id, selectElement])

  return (
    <div
      ref={(node) => { ref.current = node; drag(node) }}
      className={`canvas-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ left: element.x, top: element.y, width: element.width, height: element.height }}
      onMouseDown={handleMouseDown}
      onClick={handleSelect}
    >
      <div className="ce-header">
        <span className="ce-label">#{index + 1} {element.name}</span>
        <div className="ce-actions">
          <span className="ce-mode-indicator">{canvasMode === 'source' ? '</>' : '(i)'}</span>
          <button className="ce-delete-btn" onClick={handleDelete} title="Delete">x</button>
        </div>
      </div>
      <div className="ce-body">
        {canvasMode === 'source' ? (
          <ComponentPreview html={element.html} css={element.css} />
        ) : (
          <div className="ce-description">
            <div className="ce-desc-header">
              <span className="ce-desc-name">{element.name}</span>
              <span className="ce-desc-type">{element.type}</span>
            </div>
            <p className="ce-desc-text">{element.description}</p>
            <div className="ce-desc-meta">
              <span>Category: {element.category}</span>
              <span>Position: ({Math.round(element.x)}, {Math.round(element.y)})</span>
            </div>
          </div>
        )}
      </div>
      <div className="ce-connectors">
        <div className="ce-connector top" />
        <div className="ce-connector right" />
        <div className="ce-connector bottom" />
        <div className="ce-connector left" />
      </div>
    </div>
  )
}

export default CanvasElementComponent
