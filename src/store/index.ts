import { create } from 'zustand'
import { CanvasElement, Connection, Category, ComponentItem, SavedImport } from '../types'

const STORAGE_KEY = 'my-awesome-imports'

function loadSavedImports(): SavedImport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveSavedImports(imports: SavedImport[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(imports)) } catch {}
}

const CATEGORY_LABELS: Record<string, string> = {
  backgrounds: 'Backgrounds', buttons: 'Buttons', cards: 'Cards',
  bars: 'Bars', navigation: 'Navigation', inputs: 'Inputs',
  feedback: 'Feedback', status: 'Status', tabs: 'Tabs',
  grids: 'Grids', glass: 'Glass', colors: 'Color Palettes',
  dashboard: 'Dashboard', data: 'Data', code: 'Code',
  media: 'Media', layout: 'Layout', switches: 'Switches',
  skeletons: 'Skeletons', typography: 'Typography',
}

const CATEGORY_ICONS: Record<string, string> = {
  Backgrounds: '[Bg]', Buttons: '[Btn]', Cards: '[Card]',
  Bars: '[Bar]', Navigation: '[Nav]', Inputs: '[Inp]',
  Feedback: '[Fb]', Status: '[St]', Tabs: '[Tab]',
  Grids: '[Grid]', Glass: '[Glass]', 'Color Palettes': '[Pal]',
  Dashboard: '[Db]', Data: '[Data]', Code: '[Code]',
  Media: '[Media]', Layout: '[Lay]', Switches: '[Sw]',
  Skeletons: '[Sk]', Typography: '[Typo]',
}

const GRID_SIZE = 20
let cachedCategories: Category[] | null = null

async function loadData(): Promise<Category[]> {
  if (cachedCategories) return cachedCategories

  const module: any = await import('../data/components.json')
  const raw = module.default || module
  const cats: Category[] = []

  for (const [key, catData] of Object.entries(raw.categories || raw)) {
    const label = CATEGORY_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1)
    const items = (catData as any).items || (catData as any[]) || []
    const comps: ComponentItem[] = (items as any[]).map((p: any, i: number) => ({
      id: `${key}-${i}`,
      name: p.componentName || `${key}-${i + 1}`,
      category: label,
      type: p.type || key,
      html: p.html || '',
      css: p.css || '',
      description: p.description || `A ${key.slice(0, -1)} component`,
      source: p.source || key,
    }))
    cats.push({ name: label, expanded: false, components: comps })
  }

  cachedCategories = cats
  return cats
}

const snapToGrid = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE

function findConnectedGraph(elements: CanvasElement[], connections: Connection[], startId?: string | null): CanvasElement[] {
  if (elements.length === 0) return []

  if (!startId || !elements.find(e => e.id === startId)) {
    const connectedIds = new Set<string>()
    const adj = new Map<string, Set<string>>()
    for (const el of elements) adj.set(el.id, new Set())
    for (const conn of connections) {
      adj.get(conn.fromId)?.add(conn.toId)
      adj.get(conn.toId)?.add(conn.fromId)
    }
    const visited = new Set<string>()
    for (const el of elements) {
      if (!visited.has(el.id)) {
        const stack = [el.id]
        while (stack.length) {
          const id = stack.pop()!
          if (visited.has(id)) continue
          visited.add(id)
          for (const n of adj.get(id) || []) stack.push(n)
        }
      }
    }
    return elements.filter(e => visited.has(e.id))
  }

  const adj = new Map<string, Set<string>>()
  for (const el of elements) adj.set(el.id, new Set())
  for (const conn of connections) {
    adj.get(conn.fromId)?.add(conn.toId)
    adj.get(conn.toId)?.add(conn.fromId)
  }

  const connected = new Set<string>()
  const queue = [startId]
  while (queue.length) {
    const id = queue.shift()!
    if (connected.has(id)) continue
    connected.add(id)
    for (const n of adj.get(id) || []) queue.push(n)
  }

  return elements.filter(e => connected.has(e.id))
}

export interface ToolDefinition {
  name: string
  label: string
  file: string
}

export const TOOLS: ToolDefinition[] = [
  { name: 'color-palette', label: 'Color Palette', file: 'color-palette.html' },
  { name: 'text-gradient', label: 'Text Gradient', file: 'text-gradient-generator.html' },
  { name: 'mesh-gradient', label: 'Mesh Gradient', file: 'mesh-gradient-generator.html' },
  { name: 'ui-studio', label: 'UI Component Studio', file: 'awsome_desinger.html' },
]

interface Snapshot {
  elements: CanvasElement[]
  connections: Connection[]
}

interface AppState {
  categories: Category[]
  canvasElements: CanvasElement[]
  connections: Connection[]
  selectedElementId: string | null
  canvasMode: 'source' | 'description'
  isLoading: boolean
  activeTool: string | null
  undoStack: Snapshot[]
  redoStack: Snapshot[]
  savedImports: SavedImport[]
  saveImport: (imp: { name: string; html: string; css: string; js?: string; source: string }) => void
  deleteSavedImport: (id: string) => void
  setCategories: (categories: Category[]) => void
  addCanvasElement: (element: CanvasElement) => void
  updateCanvasElement: (id: string, updates: Partial<CanvasElement>) => void
  removeCanvasElement: (id: string) => void
  selectElement: (id: string | null) => void
  setCanvasMode: (mode: 'source' | 'description') => void
  triggerGenerate: boolean
  setTriggerGenerate: (v: boolean) => void
  addConnection: (connection: Connection) => void
  updateElementPosition: (id: string, x: number, y: number) => void
  setActiveTool: (tool: string | null) => void
  pushUndo: () => void
  undo: () => void
  redo: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  categories: [],
  canvasElements: [],
  connections: [],
  selectedElementId: null,
  canvasMode: 'source',
  isLoading: true,
  activeTool: null,
  undoStack: [],
  redoStack: [],
  savedImports: loadSavedImports(),

  saveImport: (imp) => set((state) => {
    const updated = [...state.savedImports, {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
      ...imp,
      createdAt: Date.now(),
    }]
    saveSavedImports(updated)
    return { savedImports: updated }
  }),

  deleteSavedImport: (id) => set((state) => {
    const updated = state.savedImports.filter(i => i.id !== id)
    saveSavedImports(updated)
    return { savedImports: updated }
  }),

  setCategories: (categories) => set({ categories, isLoading: false }),

  pushUndo: () => set((state) => ({
    undoStack: [...state.undoStack.slice(-49), { elements: state.canvasElements.slice(), connections: state.connections.slice() }],
    redoStack: [],
  })),

  undo: () => {
    const state = get()
    if (state.undoStack.length === 0) return
    const prev = state.undoStack[state.undoStack.length - 1]
    set({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, { elements: state.canvasElements.slice(), connections: state.connections.slice() }],
      canvasElements: prev.elements,
      connections: prev.connections,
    })
  },

  redo: () => {
    const state = get()
    if (state.redoStack.length === 0) return
    const next = state.redoStack[state.redoStack.length - 1]
    set({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, { elements: state.canvasElements.slice(), connections: state.connections.slice() }],
      canvasElements: next.elements,
      connections: next.connections,
    })
  },

  addCanvasElement: (element) => set((state) => ({
    canvasElements: [...state.canvasElements, element],
  })),

  updateCanvasElement: (id, updates) => set((state) => ({
    canvasElements: state.canvasElements.map((el) =>
      el.id === id ? { ...el, ...updates } : el
    ),
  })),

  removeCanvasElement: (id) => set((state) => ({
    canvasElements: state.canvasElements.filter((el) => el.id !== id),
    connections: state.connections.filter((c) => c.fromId !== id && c.toId !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
  })),

  selectElement: (id) => set({ selectedElementId: id }),

  setCanvasMode: (mode) => set({ canvasMode: mode }),
  triggerGenerate: false,
  setTriggerGenerate: (v) => set({ triggerGenerate: v }),

  addConnection: (connection) => set((state) => ({
    connections: [...state.connections, connection],
  })),

  updateElementPosition: (id, x, y) => set((state) => ({
    canvasElements: state.canvasElements.map((el) =>
      el.id === id ? { ...el, x: snapToGrid(x), y: snapToGrid(y) } : el
    ),
  })),

  setActiveTool: (tool) => set({ activeTool: tool }),
}))

export { CATEGORY_ICONS, loadData, GRID_SIZE, snapToGrid, findConnectedGraph }

