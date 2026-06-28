import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAppStore, findConnectedGraph } from '../../store'
import './GenerateWindow.css'

function GenerateWindow() {
  const canvasElements = useAppStore((s) => s.canvasElements)
  const connections = useAppStore((s) => s.connections)
  const selectedElementId = useAppStore((s) => s.selectedElementId)
  const canvasMode = useAppStore((s) => s.canvasMode)
  const triggerGenerate = useAppStore((s) => s.triggerGenerate)
  const setTriggerGenerate = useAppStore((s) => s.setTriggerGenerate)
  const [output, setOutput] = useState('')
  const [liveText, setLiveText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textRef = useRef('')
  const charsRef = useRef<string[]>([])
  const indexRef = useRef(0)

  const connectedElements = useMemo(() =>
    findConnectedGraph(canvasElements, connections, selectedElementId),
    [canvasElements, connections, selectedElementId]
  )

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const startGenerate = useCallback(() => {
    if (canvasElements.length === 0 || connectedElements.length === 0) {
      setOutput('/* No connected nodes found. Connect nodes on the canvas first. */')
      return
    }

    let fullText = ''

    if (canvasMode === 'source') {
      fullText = connectedElements
        .map((el) =>
          `/* ===== ${el.name} (${el.type}) ===== */\n\n${el.css}\n\n${el.html}\n`
        )
        .join('\n')
    } else {
      const lines: string[] = [
        `Connected components: ${connectedElements.length}`,
        '', '---', '',
      ]
      connectedElements.forEach((el) => {
        lines.push(
          `${el.name}`,
          '',
          `Type: ${el.type}`,
          `Category: ${el.category}`,
          `Description: ${el.description || 'No description'}`,
          `Position: X=${Math.round(el.x)}, Y=${Math.round(el.y)}`,
          `Size: ${el.width}x${el.height}`,
          '',
          '---',
          '',
        )
      })
      fullText = lines.join('\n')
    }

    textRef.current = ''
    charsRef.current = fullText.split('')
    indexRef.current = 0
    setIsGenerating(true)
    setProgress(0)
    setLiveText('')
    setOutput('')

    const chunkSize = Math.max(1, Math.floor(charsRef.current.length / 60))

    intervalRef.current = setInterval(() => {
      const chars = charsRef.current
      const end = Math.min(indexRef.current + chunkSize, chars.length)
      const chunk = chars.slice(indexRef.current, end).join('')
      textRef.current += chunk
      indexRef.current = end
      setLiveText(textRef.current)
      setProgress(Math.round((indexRef.current / chars.length) * 100))

      if (indexRef.current >= chars.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setOutput(textRef.current)
        setLiveText('')
        setIsGenerating(false)
        setProgress(100)
      }
    }, 40)
  }, [canvasElements.length, connectedElements, canvasMode])

  // React to triggerGenerate from store
  useEffect(() => {
    if (triggerGenerate && canvasElements.length > 0 && connectedElements.length > 0) {
      setTriggerGenerate(false)
      startGenerate()
    }
  }, [triggerGenerate, canvasElements.length, connectedElements.length, startGenerate])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const handleGenerate = () => {
    if (isGenerating) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setIsGenerating(false)
      setLiveText('')
      return
    }
    startGenerate()
  }

  const connectedCount = connectedElements.length

  const renderedOutput = useMemo(() => {
    if (!output) return null
    if (canvasMode === 'source') {
      return (
        <SyntaxHighlighter language="html" style={oneDark} customStyle={{ margin: 0, background: 'transparent', fontSize: 11 }} PreTag="div">
          {output}
        </SyntaxHighlighter>
      )
    }
    return (
      <pre className="gw-output-text" style={{ fontFamily: '"Fira Code", "Cascadia Code", monospace', fontSize: 11, color: '#e2e2e8', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {output.split('\n').map((line, i) => {
          const trimmed = line.trim()
          if (trimmed.startsWith('---')) return <span key={i} style={{ color: '#333', display: 'block' }}>{line}</span>
          if (trimmed.includes(':') && !trimmed.startsWith('Connected')) {
            const idx = line.indexOf(':')
            const key = line.slice(0, idx)
            const val = line.slice(idx + 1)
            return <span key={i} style={{ display: 'block' }}><span style={{ color: '#00c8ff' }}>{key}</span><span style={{ color: '#888' }}>:</span><span style={{ color: '#e2e2e8' }}>{val}</span></span>
          }
          if (trimmed.startsWith('Connected')) return <span key={i} style={{ color: '#888', display: 'block' }}>{line}</span>
          if (trimmed) return <span key={i} style={{ color: '#f0c040', fontWeight: 500, display: 'block' }}>{line}</span>
          return <span key={i} style={{ display: 'block' }}>{line}</span>
        })}
      </pre>
    )
  }, [output, canvasMode])

  return (
    <div className="generate-window">
      <div className="gw-header">
        <div className="gw-info">
          <span className="gw-count">
            {canvasElements.length > 0
              ? `${connectedCount} of ${canvasElements.length} connected`
              : '0 elements'}
          </span>
        </div>
        <button
          className={`gw-generate-btn ${isGenerating ? 'stop' : ''}`}
          onClick={handleGenerate}
          disabled={canvasElements.length === 0 || connectedCount === 0}
        >
          {isGenerating ? 'Stop' : 'Generate'}
        </button>
      </div>

      {isGenerating && (
        <div className="gw-progress">
          <div className="gw-progress-bar">
            <div className="gw-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="gw-progress-text">{progress}%</span>
        </div>
      )}

      <div className="gw-output" ref={outputRef}>
        {(output || liveText) ? (
          <div style={{ position: 'relative' }}>
            {output ? null : (
              <button
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 6, color: '#888', cursor: 'default',
                  padding: '4px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4,
                  zIndex: 5,
                }}
              >Generating...</button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(output)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
              style={{
                position: 'absolute', top: 8, right: 8,
                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)',
                border: copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6, color: copied ? '#22c55e' : '#aaa', cursor: 'pointer',
                padding: '4px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4,
                zIndex: 5, transition: 'all .2s',
              }}
              title="Copy output"
              onMouseEnter={e => { if (!copied) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)' }}
              onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="12" height="12" fill="currentColor"><path d="M480 400L288 400C279.2 400 272 392.8 272 384L272 128C272 119.2 279.2 112 288 112L421.5 112C425.7 112 429.8 113.7 432.8 116.7L491.3 175.2C494.3 178.2 496 182.3 496 186.5L496 384C496 392.8 488.8 400 480 400zM288 448L480 448C515.3 448 544 419.3 544 384L544 186.5C544 169.5 537.3 153.2 525.3 141.2L466.7 82.7C454.7 70.7 438.5 64 421.5 64L288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L368 496L368 512C368 520.8 360.8 528 352 528L160 528C151.2 528 144 520.8 144 512L144 256C144 247.2 151.2 240 160 240L176 240L176 192L160 192z"/></svg>
              {copied ? 'Done' : 'Copy'}
            </button>
            {output ? renderedOutput : (
              <pre className="gw-output-text" style={{ fontFamily: '"Fira Code", "Cascadia Code", monospace', fontSize: 11, color: '#e2e2e8', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{liveText}</pre>
            )}
          </div>
        ) : (
          <div className="gw-placeholder">
            {canvasElements.length === 0
              ? 'Add components to the canvas and connect them, then generate output.'
              : connectedCount === 0
                ? 'No connected nodes. Connect nodes by adding multiple elements to the canvas.'
                : 'Press "Generate" to see the result.'}
          </div>
        )}
      </div>
    </div>
  )
}

export default GenerateWindow
