import { useState, useRef } from 'react'
import { useAppStore } from '../../store'
import { CanvasElement } from '../../types'
import './ImportModal.css'

interface Props {
  onClose: () => void
}

export default function ImportModal({ onClose }: Props) {
  const addCanvasElement = useAppStore(s => s.addCanvasElement)
  const addConnection = useAppStore(s => s.addConnection)
  const selectElement = useAppStore(s => s.selectElement)
  const canvasElements = useAppStore(s => s.canvasElements)
  const saveImport = useAppStore(s => s.saveImport)

  const [htmlOnly, setHtmlOnly] = useState(true)
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [js, setJs] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name.replace(/\.[^/.]+$/, ''))
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setHtml(text)
      // Try to extract CSS from <style> tags
      const styleMatch = text.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
      if (styleMatch) {
        setCss(styleMatch[1])
        setHtmlOnly(false)
      }
      // Try to extract JS from <script> tags
      const scriptMatch = text.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
      if (scriptMatch) {
        setJs(scriptMatch[1])
      }
    }
    reader.readAsText(file)
  }

  const detectSource = () => {
    const hasHtml = html.trim().length > 0
    const hasCss = css.trim().length > 0 && !htmlOnly
    const hasJs = js.trim().length > 0 && !htmlOnly
    if (hasHtml && hasCss && hasJs) return 'html+css+js'
    if (hasHtml && hasCss) return 'html+css'
    return 'html'
  }

  const handleSubmit = () => {
    const trimmedHtml = html.trim()
    if (!trimmedHtml) return

    // Smart linking: wrap CSS in <style> and inject into HTML
    let finalHtml = trimmedHtml
    let finalCss = css

    if (!htmlOnly && css.trim()) {
      // If CSS is provided, wrap it in <style> and prepend to HTML
      finalHtml = `<style>\n${css}\n</style>\n\n${trimmedHtml}`
    }

    const source = detectSource()
    const name = fileName || 'Imported Design'

    saveImport({ name, html: finalHtml, css: finalCss, js: js || undefined, source })

    const newEl: CanvasElement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      componentId: 'import-' + Date.now(),
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 360,
      height: 240,
      name,
      category: 'Imports',
      type: 'import',
      html: finalHtml,
      css: finalCss,
      js: js || undefined,
      description: `Imported design (${source})`,
      source,
      mode: 'source',
    }
    addCanvasElement(newEl)

    if (canvasElements.length > 0) {
      addConnection({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        fromId: canvasElements[canvasElements.length - 1].id,
        toId: newEl.id,
      })
    }
    selectElement(newEl.id)
    onClose()
  }

  return (
    <div className="import-overlay" onClick={onClose}>
      <div className="import-modal" onClick={e => e.stopPropagation()}>
        <div className="import-header">
          <h2 className="import-title">Import Design</h2>
          <button className="import-close" onClick={onClose}>✕</button>
        </div>

        <div className="import-body">
          <div className="import-field">
            <label className="import-field-label">Name</label>
            <input className="import-name-input" value={fileName} onChange={e => setFileName(e.target.value)}
              placeholder="My Design" />
          </div>
          <div className="import-file-row">
            <button className="import-file-btn" onClick={() => fileRef.current?.click()}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="12" height="12" fill="currentColor"><path d="M480 400L288 400C279.2 400 272 392.8 272 384L272 128C272 119.2 279.2 112 288 112L421.5 112C425.7 112 429.8 113.7 432.8 116.7L491.3 175.2C494.3 178.2 496 182.3 496 186.5L496 384C496 392.8 488.8 400 480 400zM288 448L480 448C515.3 448 544 419.3 544 384L544 186.5C544 169.5 537.3 153.2 525.3 141.2L466.7 82.7C454.7 70.7 438.5 64 421.5 64L288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L368 496L368 512C368 520.8 360.8 528 352 528L160 528C151.2 528 144 520.8 144 512L144 256C144 247.2 151.2 240 160 240L176 240L176 192L160 192z"/></svg>
              Open HTML File
            </button>
            <input ref={fileRef} type="file" accept=".html,.htm" style={{ display: 'none' }} onChange={handleFile} />
          </div>

          <div className="import-toggle-row">
            <span className="import-toggle-label">HTML only</span>
            <label className="import-switch">
              <input type="checkbox" checked={htmlOnly} onChange={e => setHtmlOnly(e.target.checked)} />
              <span className="import-slider"></span>
            </label>
          </div>

          <div className="import-field">
            <label className="import-field-label">HTML</label>
            <textarea className="import-textarea" value={html} onChange={e => setHtml(e.target.value)}
              placeholder="<div>Your HTML here...</div>" spellCheck={false} />
          </div>

          {!htmlOnly && (
            <>
              <div className="import-field">
                <label className="import-field-label">CSS</label>
                <textarea className="import-textarea" value={css} onChange={e => setCss(e.target.value)}
                  placeholder=".my-class { color: #00c8ff; }" spellCheck={false} />
              </div>
              <div className="import-field">
                <label className="import-field-label">JS</label>
                <textarea className="import-textarea" value={js} onChange={e => setJs(e.target.value)}
                  placeholder="console.log('hello');" spellCheck={false} />
              </div>
            </>
          )}

          <div className="import-source-info">
            Detected source: <strong>{detectSource()}</strong>
          </div>
        </div>

        <div className="import-footer">
          <button className="import-cancel" onClick={onClose}>Cancel</button>
          <button className="import-submit" onClick={handleSubmit} disabled={!html.trim()}>
            Add to Canvas
          </button>
        </div>
      </div>
    </div>
  )
}
