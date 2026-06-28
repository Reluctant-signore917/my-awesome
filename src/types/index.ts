export interface ComponentItem {
  id: string
  name: string
  category: string
  type: string
  html: string
  css: string
  js?: string
  description: string
  preview?: string
  source: string
}

export interface ParsedComponent {
  componentName: string
  category: string
  type: string
  html: string
  css: string
  js: string
  description: string
  source: string
}

export interface CanvasElement {
  id: string
  componentId: string
  x: number
  y: number
  width: number
  height: number
  name: string
  category: string
  type: string
  html: string
  css: string
  js?: string
  description: string
  source: string
  mode: 'source' | 'description'
}

export interface Connection {
  id: string
  fromId: string
  toId: string
}

export interface Category {
  name: string
  components: ComponentItem[]
  expanded: boolean
}

export interface SavedImport {
  id: string
  name: string
  html: string
  css: string
  js?: string
  source: string
  createdAt: number
}
