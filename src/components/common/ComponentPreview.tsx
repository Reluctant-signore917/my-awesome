import { useRef, useEffect, memo } from 'react'

interface Props {
  html: string
  css?: string
  maxHeight?: number
}

function ComponentPreview({ html, css, maxHeight }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<ShadowRoot | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!shadowRef.current) {
      shadowRef.current = el.attachShadow({ mode: 'open' })
    }
    const root = shadowRef.current
    root.replaceChildren()
    const baseStyle = document.createElement('style')
    baseStyle.textContent = '*{box-sizing:border-box;margin:0;padding:0}:host{all:initial;display:block;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#e0e0e0}'
    root.appendChild(baseStyle)
    if (css) {
      const styleEl = document.createElement('style')
      styleEl.textContent = css
      root.appendChild(styleEl)
    }
    const wrapper = document.createElement('div')
    wrapper.innerHTML = html
    root.appendChild(wrapper)
  }, [html, css])

  return (
    <div
      ref={ref}
      className="component-preview-root"
      style={{ maxHeight: maxHeight || 9999, overflow: 'hidden', pointerEvents: 'none' }}
    />
  )
}

export default memo(ComponentPreview, (prev, next) =>
  prev.html === next.html && prev.css === next.css && prev.maxHeight === next.maxHeight
)
