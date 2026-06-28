import { useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Sidebar from './components/Sidebar/Sidebar'
import Canvas from './components/Canvas/Canvas'
import GenerateWindow from './components/GenerateWindow/GenerateWindow'
import { useAppStore, loadData } from './store'
import './App.css'

function App() {
  const categories = useAppStore((s) => s.categories)
  const isLoading = useAppStore((s) => s.isLoading)
  const setCategories = useAppStore((s) => s.setCategories)

  useEffect(() => {
    loadData().then(setCategories)
  }, [setCategories])

  const total = categories.reduce((sum, c) => sum + c.components.length, 0)

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        {isLoading && categories.length === 0 ? (
          <div className="loading-screen">
            <div className="loading-spinner" />
            <span>Loading {total || 'components'}...</span>
          </div>
        ) : (
          <>
            <Sidebar />
            <div className="canvas-area">
              <Canvas />
            </div>
            <div className="right-panel">
              <GenerateWindow />
            </div>
          </>
        )}
      </div>
    </DndProvider>
  )
}

export default App
