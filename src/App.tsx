import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import './App.css'
import './font-library.css'
import './page-background.css'
import './editor-polish.css'
import './building-blocks.css'
import './button-settings.css'
import './portfolio-library.css'
import './tutorial.css'
import { motionCss } from './motion'
import HomeScreen from './HomeScreen'
import CreditsScreen from './CreditsScreen'
import PlansScreen from './PlansScreen'
import { createMinaPages } from './minaPortfolio'
import LocalAccountScreen from './LocalAccountScreen'
import { BlockView } from './components/BlockView'
import { Field, Inspector } from './components/Inspector'
import { createLocalProfile, loadLocalWorkspace, saveLocalWorkspace, type LocalWorkspace } from './localWorkspace'
import type { Asset, AssetKind, Block, BlockType, CanvasAnchorX, CanvasAnchorY, DragStartPositions, ImageFit, LayoutMode, Page, PageBackground, PageTransition, Portfolio, Position, ResizeCorner, ResponsiveOverride, ResponsiveOverrideKey, ResponsiveRange, ShapeResize, BackgroundType } from './domain/types'
import { blockInfo, defaultBackground, defaultPosition, makeBlock, makeId, MAX_BLOCKS_PER_PAGE, MAX_FONT_FILE_SIZE, MAX_HISTORY_STEPS, MAX_IMAGE_FILE_SIZE, offsetFromPhysicalPercent, physicalAnchorPercent, rangeForViewport, rangeSpecs, trayGroups } from './domain/folio'
import { fontStack } from './domain/fonts'
import { pageBackgroundStyle } from './domain/pageStyle'

export type { Asset, Block, Page, Portfolio } from './domain/types'

const PANEL_EVENT = 'folio-panel-open'
const announcePanel = (id: string) => window.dispatchEvent(new CustomEvent<string>(PANEL_EVENT, { detail: id }))
const publicPortfolioIdFromHash = () => window.location.hash.match(/^#\/p\/([^/]+)$/)?.[1] ?? null
const publicPortfolioUrl = (id: string) => `${window.location.origin}${window.location.pathname}#/p/${id}`
const starterPages: Page[] = createMinaPages()
const clonePages = () => structuredClone(starterPages) as Page[]
const makePortfolio = (id: string, name: string, description: string, color: string): Portfolio => ({ id, name, description, color, showPortfolioName: true, pages: clonePages(), homePageId: 'home', updated: 'just now' })
const makeBlankPortfolio = (id: string): Portfolio => ({ id, name: 'Untitled portfolio', description: 'A fresh place to show your work', color: '#f4c5a8', showPortfolioName: true, pages: [{ id: 'home', name: 'Home', slug: '', showHeader: true, showInNav: false, transition: 'lift', layout: 'canvas', background: defaultBackground(), blocks: [] }], homePageId: 'home', updated: 'just now' })
const makePreviewWorkspace = (): LocalWorkspace => ({ version: 1, profile: { id: 'preview', name: 'Guest', email: '', createdAt: '' }, portfolios: [makePortfolio('mina', 'Mina’s portfolio', 'A fully editable example portfolio', '#b8a1ff')], assets: [], activePortfolioId: 'mina' })

function App() {
  const [workspace, setWorkspaceState] = useState<LocalWorkspace>(makePreviewWorkspace)
  const workspaceRef = useRef(workspace)
  const historyRef = useRef<{ past: LocalWorkspace[]; future: LocalWorkspace[] }>({ past: [], future: [] })
  const [history, setHistory] = useState({ canUndo: false, canRedo: false })
  const historyMuted = useRef(false)
  const [workspaceReady, setWorkspaceReady] = useState(false)
  const [hasLocalProfile, setHasLocalProfile] = useState(false)
  const [signedIn, setSignedIn] = useState(() => window.localStorage.getItem('folio-local-session') === 'active')
  const [authMode, setAuthMode] = useState<'signup' | 'login' | null>(null)
  const [saveState, setSaveState] = useState<'loading' | 'saved' | 'saving' | 'error'>('loading')
  const [view, setView] = useState<'home' | 'credits' | 'plans' | 'library' | 'builder'>('home')
  const [pageId, setPageId] = useState('home')
  const [selectedId, setSelectedId] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [inspectorOpen, setInspectorOpen] = useState(0)
  const [copiedBlock, setCopiedBlock] = useState<Block | null>(null)
  const [addTrayOpen, setAddTrayOpen] = useState(false)
  const [addTrayView, setAddTrayView] = useState<'blocks' | 'assets'>('blocks')
  useEffect(() => {
    const closeTray = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== 'add-tray') setAddTrayOpen(false)
    }
    window.addEventListener(PANEL_EVENT, closeTray)
    return () => window.removeEventListener(PANEL_EVENT, closeTray)
  }, [])
  useEffect(() => {
    if (addTrayOpen) announcePanel('add-tray')
  }, [addTrayOpen])
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<Position | null>(null)
  const [dragStartPositions, setDragStartPositions] = useState<DragStartPositions | null>(null)
  const ignoreNextSelectionClick = useRef(false)
  const [resizingShape, setResizingShape] = useState<ShapeResize | null>(null)
  const [preview, setPreview] = useState(false)
  const [previewRun, setPreviewRun] = useState(0)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [responsiveRange, setResponsiveRange] = useState<ResponsiveRange>('wide')
  const setResponsiveTarget = (range: ResponsiveRange) => {
    setResponsiveRange(range)
  }
  const [publicPortfolioId, setPublicPortfolioId] = useState(publicPortfolioIdFromHash)
  useEffect(() => {
    const readHash = () => setPublicPortfolioId(publicPortfolioIdFromHash())
    window.addEventListener('hashchange', readHash)
    return () => window.removeEventListener('hashchange', readHash)
  }, [])
  useEffect(() => {
    let active = true
    loadLocalWorkspace().then(saved => {
      if (!active) return
      if (saved) { workspaceRef.current = saved; setWorkspaceState(saved); setHasLocalProfile(true) }
      setWorkspaceReady(true)
      setSaveState('saved')
    }).catch(() => { if (active) { setWorkspaceReady(true); setSaveState('error') } })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!workspaceReady || !hasLocalProfile) return
    let active = true
    const timer = window.setTimeout(() => {
      setSaveState('saving')
      saveLocalWorkspace(workspace).then(() => { if (active) setSaveState('saved') }).catch(() => { if (active) setSaveState('error') })
    }, 350)
    return () => { active = false; window.clearTimeout(timer) }
  }, [workspace, workspaceReady, hasLocalProfile])
  const portfolios = workspace.portfolios
  const assets = workspace.assets
  const activePortfolioId = workspace.activePortfolioId
  const refreshHistory = () => setHistory({ canUndo: historyRef.current.past.length > 0, canRedo: historyRef.current.future.length > 0 })
  const resetHistory = () => { historyRef.current = { past: [], future: [] }; refreshHistory() }
  const rememberWorkspace = (snapshot: LocalWorkspace) => {
    historyRef.current = { past: [...historyRef.current.past, structuredClone(snapshot)].slice(-MAX_HISTORY_STEPS), future: [] }
    refreshHistory()
  }
  const commitWorkspace = (update: LocalWorkspace | ((current: LocalWorkspace) => LocalWorkspace)) => {
    const current = workspaceRef.current
    const next = typeof update === 'function' ? update(current) : update
    if (!historyMuted.current) rememberWorkspace(current)
    workspaceRef.current = next
    setWorkspaceState(next)
  }
  const beginHistoryGesture = () => {
    if (historyMuted.current) return
    rememberWorkspace(workspaceRef.current)
    historyMuted.current = true
  }
  const undo = () => {
    const previous = historyRef.current.past.at(-1)
    if (!previous) return
    const current = structuredClone(workspaceRef.current)
    historyRef.current = { past: historyRef.current.past.slice(0, -1), future: [current, ...historyRef.current.future].slice(0, MAX_HISTORY_STEPS) }
    workspaceRef.current = structuredClone(previous)
    setWorkspaceState(workspaceRef.current)
    const restoredPortfolio = previous.portfolios.find(item => item.id === previous.activePortfolioId) ?? previous.portfolios[0]
    if (restoredPortfolio) setPageId(id => restoredPortfolio.pages.some(item => item.id === id) ? id : restoredPortfolio.homePageId)
    clearSelection()
    refreshHistory()
  }
  const redo = () => {
    const next = historyRef.current.future[0]
    if (!next) return
    const current = structuredClone(workspaceRef.current)
    historyRef.current = { past: [...historyRef.current.past, current].slice(-MAX_HISTORY_STEPS), future: historyRef.current.future.slice(1) }
    workspaceRef.current = structuredClone(next)
    setWorkspaceState(workspaceRef.current)
    const restoredPortfolio = next.portfolios.find(item => item.id === next.activePortfolioId) ?? next.portfolios[0]
    if (restoredPortfolio) setPageId(id => restoredPortfolio.pages.some(item => item.id === id) ? id : restoredPortfolio.homePageId)
    clearSelection()
    refreshHistory()
  }
  const setPortfolios = (update: Portfolio[] | ((items: Portfolio[]) => Portfolio[])) => commitWorkspace(current => ({ ...current, portfolios: typeof update === 'function' ? update(current.portfolios) : update }))
  const setAssets = (update: Asset[] | ((items: Asset[]) => Asset[])) => commitWorkspace(current => ({ ...current, assets: typeof update === 'function' ? update(current.assets) : update }))
  const setActivePortfolioId = (id: string) => {
    const next = { ...workspaceRef.current, activePortfolioId: id }
    workspaceRef.current = next
    setWorkspaceState(next)
  }
  const portfolio = portfolios.find(item => item.id === activePortfolioId) ?? portfolios[0] ?? makeBlankPortfolio('empty-portfolio')
  const pages = portfolio.pages
  const page = pages.find(item => item.id === pageId)!
  const selected = page.blocks.find(item => item.id === selectedId)
  const isCanvas = page.layout === 'canvas'
  const editingOverrideKey = rangeSpecs[responsiveRange].overrideKey

  useEffect(() => {
    const id = `folio-motion-${portfolio.id}`
    const style = document.getElementById(id) as HTMLStyleElement | null ?? document.createElement('style')
    style.id = id
    style.textContent = page.blocks.map(block => motionCss(block.id, block.type, { entrance: block.animation, delay: block.animationDelay ?? 0, duration: block.animationDuration ?? .55, loop: block.loopAnimation ?? 'none' })).join('')
    if (!style.parentNode) document.head.appendChild(style)
    return () => { style.remove() }
  }, [portfolio.id, page.blocks])

  useEffect(() => {
    const canvasHeight = Math.max(700, Math.min(2400, page.canvasHeight ?? 900))
    document.documentElement.style.setProperty('--folio-canvas-height', `${canvasHeight}px`)
    return () => { document.documentElement.style.removeProperty('--folio-canvas-height') }
  }, [page.id, page.canvasHeight])

  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-block-editable]').forEach(element => {
      element.contentEditable = preview ? 'false' : 'true'
    })
  }, [preview, page.id, page.blocks])

  useEffect(() => {
    assets.filter(asset => asset.kind === 'font' && asset.family).forEach(asset => {
      const face = new FontFace(asset.family!, `url(${asset.dataUrl})`)
      face.load().then(loaded => document.fonts.add(loaded)).catch(() => undefined)
    })
  }, [assets])

  const updatePortfolio = (fn: (item: Portfolio) => Portfolio) => setPortfolios(items => items.map(item => item.id === activePortfolioId ? fn(item) : item))
  const updateBlocks = (fn: (blocks: Block[]) => Block[]) => updatePortfolio(item => ({ ...item, pages: item.pages.map(current => current.id === pageId ? { ...current, blocks: fn(current.blocks) } : current), updated: 'just now' }))
  const clearSelection = () => { setSelectedId(''); setSelectedIds([]); setInspectorOpen(0) }
  const selectBlock = (id: string, additive = false) => {
    if (!additive && ignoreNextSelectionClick.current) { ignoreNextSelectionClick.current = false; return }
    if (!additive) { setSelectedId(id); setSelectedIds([id]); return }
    setSelectedIds(ids => {
      const next = ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]
      setSelectedId(next.length ? (next.includes(selectedId) ? selectedId : next[next.length - 1]) : '')
      return next
    })
  }
  const nextLayer = () => Math.max(0, ...page.blocks.map((block, index) => block.zIndex ?? index + 1)) + 1
  const choosePage = (next: Page) => { announcePanel(''); setPageId(next.id); clearSelection() }
  const addBlock = (type: BlockType, position?: Position) => {
    if (page.blocks.length >= MAX_BLOCKS_PER_PAGE) { window.alert(`This page has reached its ${MAX_BLOCKS_PER_PAGE}-element limit.`); return }
    const block = { ...makeBlock(type), zIndex: nextLayer(), position: isCanvas ? position ?? defaultPosition(page.blocks.length) : undefined, anchorX: isCanvas ? 'left' as CanvasAnchorX : undefined, anchorY: isCanvas ? 'top' as CanvasAnchorY : undefined }
    updateBlocks(blocks => [...blocks, block]); selectBlock(block.id); setAddTrayOpen(false)
  }
  const updateBlock = (id: string, patch: Partial<Block>) => updateBlocks(blocks => blocks.map(block => block.id === id ? { ...block, ...patch } : block))
  const updateResponsiveBlock = (id: string, range: ResponsiveOverrideKey, patch: Partial<ResponsiveOverride>) => updateBlocks(blocks => blocks.map(block => block.id !== id ? block : { ...block, responsive: { ...block.responsive, [range]: { ...block.responsive?.[range], ...patch } } }))
  const clearResponsiveBlock = (id: string, range: ResponsiveOverrideKey) => updateBlocks(blocks => blocks.map(block => {
    if (block.id !== id) return block
    const responsive = { ...block.responsive }
    delete responsive[range]
    return { ...block, responsive }
  }))
  const addAsset = (asset: Asset) => setAssets(current => [...current, asset])
  const useImageAsset = (asset: Asset) => { if (selected?.type !== 'image') return; updateBlock(selected.id, { imageUrl: asset.dataUrl, content: asset.name, imageAlt: selected.imageAlt || asset.name.replace(/\.[^.]+$/, '') }) }
  const useFontAsset = (asset: Asset) => { if (selected?.type !== 'text' || !asset.family) return; updateBlock(selected.id, { font: asset.family }) }
  const deleteBlock = (id: string) => { updateBlocks(blocks => blocks.filter(block => block.id !== id)); setSelectedIds(ids => ids.filter(item => item !== id)); if (selectedId === id) clearSelection() }
  const duplicateBlock = (id: string) => { if (page.blocks.length >= MAX_BLOCKS_PER_PAGE) { window.alert(`This page has reached its ${MAX_BLOCKS_PER_PAGE}-element limit.`); return }; const original = page.blocks.find(block => block.id === id); if (!original) return; const copy = { ...original, id: makeId(original.type), zIndex: nextLayer(), position: isCanvas ? { x: original.position?.x ?? 10, y: Math.min((original.position?.y ?? 12) + 4, 80) } : undefined }; updateBlocks(blocks => [...blocks, copy]); selectBlock(copy.id) }
  const pasteCopiedBlock = () => {
    if (page.blocks.length >= MAX_BLOCKS_PER_PAGE) { window.alert(`This page has reached its ${MAX_BLOCKS_PER_PAGE}-element limit.`); return }
    if (!copiedBlock) return
    const copy = {
      ...structuredClone(copiedBlock),
      id: makeId(copiedBlock.type),
      zIndex: nextLayer(),
      position: isCanvas ? { x: copiedBlock.position?.x ?? 10, y: Math.min((copiedBlock.position?.y ?? 12) + 4, 80) } : undefined,
    }
    updateBlocks(blocks => [...blocks, copy])
    selectBlock(copy.id)
    setAddTrayOpen(false)
  }
  const editBlock = (id: string) => { selectBlock(id); setInspectorOpen(token => token + 1) }
  const anchorCanvasBlock = (id: string, anchorX: CanvasAnchorX, anchorY: CanvasAnchorY) => {
    if (!isCanvas) return
    const position = { x: anchorX === 'center' ? 0 : 8, y: anchorY === 'center' ? 0 : 8 }
    const patch = { position, anchorX, anchorY, centerX: false, centerY: false }
    if (editingOverrideKey) updateResponsiveBlock(id, editingOverrideKey, patch)
    else updateBlock(id, patch)
  }
  const orderedLayers = (blocks: Block[]) => blocks.map((block, index) => ({ block, order: block.zIndex ?? index + 1 })).sort((a, b) => a.order - b.order).map(item => item.block)
  const applyLayerOrder = (_blocks: Block[], bottomToTop: Block[]) => bottomToTop.map((block, index) => ({ ...block, zIndex: index + 1 }))
  const moveLayer = (id: string, direction: 'forward' | 'backward' | 'front' | 'back') => updateBlocks(blocks => {
    const stack = orderedLayers(blocks); const current = stack.findIndex(block => block.id === id); if (current < 0) return blocks
    const target = direction === 'front' ? stack.length - 1 : direction === 'back' ? 0 : direction === 'forward' ? Math.min(stack.length - 1, current + 1) : Math.max(0, current - 1)
    if (target === current) return blocks
    const [layer] = stack.splice(current, 1); stack.splice(target, 0, layer)
    return applyLayerOrder(blocks, stack)
  })
  const reorderLayers = (draggedId: string, targetId: string) => updateBlocks(blocks => {
    if (draggedId === targetId) return blocks
    const topToBottom = [...orderedLayers(blocks)].reverse(); const from = topToBottom.findIndex(block => block.id === draggedId); const to = topToBottom.findIndex(block => block.id === targetId)
    if (from < 0 || to < 0) return blocks
    const [layer] = topToBottom.splice(from, 1); topToBottom.splice(to, 0, layer)
    return applyLayerOrder(blocks, [...topToBottom].reverse())
  })
  const updatePage = (patch: Partial<Page>) => updatePortfolio(item => ({ ...item, pages: item.pages.map(current => current.id === pageId ? { ...current, ...patch } : current), updated: 'just now' }))
  const setLayout = (layout: LayoutMode) => updatePortfolio(item => ({ ...item, pages: item.pages.map(current => current.id !== pageId ? current : { ...current, layout, blocks: current.blocks.map((block, index) => ({ ...block, position: layout === 'canvas' ? block.position ?? defaultPosition(index) : undefined })) }), updated: 'just now' }))
  const addPage = () => { announcePanel(''); const id = makeId('page'); const first = makeBlock('text'); const count = pages.filter(item => item.name.startsWith('New page')).length + 1; const name = count === 1 ? 'New page' : `New page ${count}`; const slug = count === 1 ? 'new-page' : `new-page-${count}`; updatePortfolio(item => ({ ...item, pages: [...item.pages, { id, name, slug, showHeader: true, showInNav: true, transition: 'fade', layout: 'scroll', background: defaultBackground(), blocks: [first] }] })); setPageId(id); clearSelection() }
  const openPortfolio = (item: Portfolio) => { setActivePortfolioId(item.id); setPageId(item.homePageId); clearSelection(); setView('builder') }
  const createPortfolio = () => { if (portfolios.length >= 3) return; const item = makeBlankPortfolio(makeId('portfolio')); setPortfolios(items => [...items, item]); openPortfolio(item) }
  const deletePortfolio = (id: string) => {
    commitWorkspace(current => {
      const remaining = current.portfolios.filter(item => item.id !== id)
      return { ...current, portfolios: remaining, activePortfolioId: remaining.find(item => item.id === current.activePortfolioId)?.id ?? remaining[0]?.id ?? '' }
    })
  }
  const startCanvasMove = (event: ReactPointerEvent<HTMLElement>, id: string) => {
    if (!isCanvas || preview) return
    if (event.shiftKey) { ignoreNextSelectionClick.current = true; selectBlock(id, true); event.preventDefault(); return }
    const target = event.target as HTMLElement
    // Canvas controls and editable text remain interactive. A portfolio button itself is draggable in the editor.
    if (target.closest('.block-tools, .resize-handle, input, textarea, select, [contenteditable]')) return
    const movingIds = selectedIds.includes(id) ? selectedIds : [id]
    if (!selectedIds.includes(id)) { setSelectedId(id); setSelectedIds([id]) }
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const canvasBounds = event.currentTarget.closest<HTMLElement>('.page-layout-canvas')?.getBoundingClientRect()
    const startingPositions = Object.fromEntries(page.blocks.filter(block => movingIds.includes(block.id)).map(block => [block.id, editingOverrideKey ? block.responsive?.[editingOverrideKey]?.position ?? block.position ?? { x: 10, y: 15 } : block.position ?? { x: 10, y: 15 }])) as DragStartPositions
    const start = startingPositions[id]
    if (!canvasBounds || !start) return
    const primary = page.blocks.find(block => block.id === id)
    const primaryOverride = editingOverrideKey ? primary?.responsive?.[editingOverrideKey] : undefined
    const anchorX = primaryOverride?.anchorX ?? primary?.anchorX
    const anchorY = primaryOverride?.anchorY ?? primary?.anchorY
    const physicalStart = {
      x: anchorX ? physicalAnchorPercent(start.x, anchorX) : start.x,
      y: anchorY ? physicalAnchorPercent(start.y, anchorY) : start.y,
    }
    beginHistoryGesture()
    setDraggingBlockId(id)
    setDragOffset({ x: event.clientX - canvasBounds.left - physicalStart.x / 100 * canvasBounds.width, y: event.clientY - canvasBounds.top - physicalStart.y / 100 * canvasBounds.height })
    setDragStartPositions(startingPositions)
  }
  const moveCanvasBlock = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingBlockId || !dragOffset || !dragStartPositions || !isCanvas) return
    const canvasElement = event.currentTarget
    const rect = canvasElement.getBoundingClientRect()
    const primaryStart = dragStartPositions[draggingBlockId]
    const primaryBlock = page.blocks.find(block => block.id === draggingBlockId)
    if (!primaryStart || !primaryBlock) return
    const roundPosition = (value: number) => Math.round(value * 10) / 10
    const primaryOverride = editingOverrideKey ? primaryBlock.responsive?.[editingOverrideKey] : undefined
    const primaryAnchorX = primaryOverride?.anchorX ?? primaryBlock.anchorX
    const primaryAnchorY = primaryOverride?.anchorY ?? primaryBlock.anchorY
    const primaryPhysicalStart = { x: primaryAnchorX ? physicalAnchorPercent(primaryStart.x, primaryAnchorX) : primaryStart.x, y: primaryAnchorY ? physicalAnchorPercent(primaryStart.y, primaryAnchorY) : primaryStart.y }
    const nextPhysical = { x: roundPosition((event.clientX - rect.left - dragOffset.x) / rect.width * 100), y: roundPosition((event.clientY - rect.top - dragOffset.y) / rect.height * 100) }
    const delta = { x: nextPhysical.x - primaryPhysicalStart.x, y: nextPhysical.y - primaryPhysicalStart.y }
    updateBlocks(blocks => blocks.map(block => {
      const start = dragStartPositions[block.id]
      if (!start) return block
      const element = canvasElement.querySelector<HTMLElement>(`[data-block-id="${block.id}"]`)
      const bounds = element?.getBoundingClientRect()
      const width = (bounds?.width ?? 0) / rect.width * 100
      const height = (bounds?.height ?? 0) / rect.height * 100
      const canBleed = ['shape', 'image', 'emitter'].includes(block.type)
      const bleedX = canBleed ? Math.min(15, Math.max(6, width * .45)) : 2
      const bleedY = canBleed ? Math.min(15, Math.max(6, height * .45)) : 3
      const override = editingOverrideKey ? block.responsive?.[editingOverrideKey] : undefined
      const blockAnchorX = override?.anchorX ?? block.anchorX
      const blockAnchorY = override?.anchorY ?? block.anchorY
      if (blockAnchorX || blockAnchorY) {
        const physicalX = (blockAnchorX ? physicalAnchorPercent(start.x, blockAnchorX) : start.x) + delta.x
        const physicalY = (blockAnchorY ? physicalAnchorPercent(start.y, blockAnchorY) : start.y) + delta.y
        const position = { x: roundPosition(Math.max(-15, Math.min(115, blockAnchorX ? offsetFromPhysicalPercent(physicalX, blockAnchorX) : physicalX))), y: roundPosition(Math.max(-15, Math.min(115, blockAnchorY ? offsetFromPhysicalPercent(physicalY, blockAnchorY) : physicalY))) }
        return editingOverrideKey ? { ...block, responsive: { ...block.responsive, [editingOverrideKey]: { ...override, position } } } : { ...block, position }
      }
      const anchorX = (override?.centerX ?? block.centerX) ? width / 2 : 0
      const anchorY = (override?.centerY ?? block.centerY) ? height / 2 : 0
      const minX = -bleedX + anchorX
      const maxX = 100 + bleedX - width + anchorX
      const minY = -bleedY + anchorY
      const maxY = 100 + bleedY - height + anchorY
      const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(Math.max(min, max), value))
      const position = { x: roundPosition(clamp(start.x + delta.x, minX, maxX)), y: roundPosition(clamp(start.y + delta.y, minY, maxY)) }
      return editingOverrideKey ? { ...block, responsive: { ...block.responsive, [editingOverrideKey]: { ...override, position } } } : { ...block, position }
    }))
  }
  const startShapeResize = (event: ReactPointerEvent<HTMLButtonElement>, id: string, corner: ResizeCorner) => {
    event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId)
    const block = page.blocks.find(item => item.id === id)
    if (!block || !['shape', 'image', 'emitter'].includes(block.type)) return
    beginHistoryGesture()
    const element = event.currentTarget.closest<HTMLElement>('.canvas-block')
    const bounds = element?.getBoundingClientRect()
    const canvasBounds = element?.closest<HTMLElement>('.page-layout-canvas')?.getBoundingClientRect()
    const defaultWidth = block.type === 'shape' ? (block.shapeType === 'pill' ? 220 : 145) : block.type === 'image' ? 420 : 240
    const defaultHeight = block.type === 'shape' ? (block.shapeType === 'pill' ? 104 : 145) : block.type === 'image' ? 280 : 180
    const responsive = editingOverrideKey ? block.responsive?.[editingOverrideKey] : undefined
    const storedWidth = responsive?.width ?? (block.type === 'shape' ? block.shapeWidth ?? defaultWidth * (block.shapeScale ?? 1) : block.type === 'image' ? block.imageWidth ?? defaultWidth : block.emitterWidth ?? defaultWidth)
    const storedHeight = responsive?.height ?? (block.type === 'shape' ? block.shapeHeight ?? defaultHeight * (block.shapeScale ?? 1) : block.type === 'image' ? block.imageHeight ?? defaultHeight : block.emitterHeight ?? defaultHeight)
    let width = block.fillCanvas ? bounds?.width ?? storedWidth : storedWidth
    let height = block.fillCanvas ? bounds?.height ?? storedHeight : storedHeight
    let resizePosition = responsive?.position ?? block.position ?? { x: 10, y: 15 }
    // A device-specific resize begins from what the creator can actually see,
    // not from a desktop measurement that may currently be visually scaled down.
    if (block.fillCanvas) {
      resizePosition = { x: 0, y: 0 }
      if (editingOverrideKey) updateResponsiveBlock(id, editingOverrideKey, { width: Math.round(width), height: Math.round(height), position: resizePosition })
    } else if (editingOverrideKey && (!responsive?.width || !responsive?.height)) {
      width = bounds?.width ?? width
      height = bounds?.height ?? height
      updateResponsiveBlock(id, editingOverrideKey, { width: Math.round(width), height: Math.round(height) })
    }
    const scaleX = (bounds?.width ?? width) / Math.max(1, width)
    const scaleY = (bounds?.height ?? height) / Math.max(1, height)
    if (block.fillCanvas && !editingOverrideKey) {
      if (block.type === 'shape') updateBlock(id, { shapeWidth: Math.round(width), shapeHeight: Math.round(height), shapeScale: undefined, fillCanvas: false, position: resizePosition })
      if (block.type === 'image') updateBlock(id, { imageWidth: Math.round(width), imageHeight: Math.round(height), fillCanvas: false, position: resizePosition })
      if (block.type === 'emitter') updateBlock(id, { emitterWidth: Math.round(width), emitterHeight: Math.round(height), fillCanvas: false, position: resizePosition })
    }
    setResizingShape({ id, type: block.type as ShapeResize['type'], corner, startX: event.clientX, startY: event.clientY, width, height, scaleX, scaleY, position: resizePosition, centerX: responsive?.centerX ?? block.centerX ?? false, centerY: responsive?.centerY ?? block.centerY ?? false, anchorX: responsive?.anchorX ?? block.anchorX, anchorY: responsive?.anchorY ?? block.anchorY, left: bounds && canvasBounds ? bounds.left - canvasBounds.left : undefined, top: bounds && canvasBounds ? bounds.top - canvasBounds.top : undefined, right: bounds && canvasBounds ? bounds.right - canvasBounds.left : undefined, bottom: bounds && canvasBounds ? bounds.bottom - canvasBounds.top : undefined })
    if (bounds) selectBlock(id)
  }
  const resizeCanvasShape = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!resizingShape || !isCanvas) return
    const rect = event.currentTarget.getBoundingClientRect()
    const deltaX = event.clientX - resizingShape.startX
    const deltaY = event.clientY - resizingShape.startY
    const fromLeft = resizingShape.corner === 'nw' || resizingShape.corner === 'sw'
    const fromTop = resizingShape.corner === 'nw' || resizingShape.corner === 'ne'
    if ((resizingShape.anchorX || resizingShape.anchorY) && resizingShape.left !== undefined && resizingShape.top !== undefined && resizingShape.right !== undefined && resizingShape.bottom !== undefined) {
      const minimumWidth = 42 * resizingShape.scaleX
      const minimumHeight = 42 * resizingShape.scaleY
      const left = fromLeft ? Math.min(resizingShape.right - minimumWidth, resizingShape.left + deltaX) : resizingShape.left
      const right = fromLeft ? resizingShape.right : Math.max(resizingShape.left + minimumWidth, resizingShape.right + deltaX)
      const top = fromTop ? Math.min(resizingShape.bottom - minimumHeight, resizingShape.top + deltaY) : resizingShape.top
      const bottom = fromTop ? resizingShape.bottom : Math.max(resizingShape.top + minimumHeight, resizingShape.bottom + deltaY)
      const width = Math.max(42, (right - left) / resizingShape.scaleX)
      const height = Math.max(42, (bottom - top) / resizingShape.scaleY)
      const anchorX = resizingShape.anchorX
      const anchorY = resizingShape.anchorY
      const physicalX = anchorX === 'right' ? right / rect.width * 100 : anchorX === 'center' ? (left + right) / 2 / rect.width * 100 : left / rect.width * 100
      const physicalY = anchorY === 'bottom' ? bottom / rect.height * 100 : anchorY === 'center' ? (top + bottom) / 2 / rect.height * 100 : top / rect.height * 100
      const position = { x: Math.max(-15, Math.min(115, offsetFromPhysicalPercent(physicalX, anchorX ?? 'left'))), y: Math.max(-15, Math.min(115, offsetFromPhysicalPercent(physicalY, anchorY ?? 'top'))) }
      if (editingOverrideKey) updateResponsiveBlock(resizingShape.id, editingOverrideKey, { width: Math.round(width), height: Math.round(height), position })
      else {
        if (resizingShape.type === 'shape') updateBlock(resizingShape.id, { shapeWidth: Math.round(width), shapeHeight: Math.round(height), shapeScale: undefined, position, fillCanvas: false })
        if (resizingShape.type === 'image') updateBlock(resizingShape.id, { imageWidth: Math.round(width), imageHeight: Math.round(height), position, fillCanvas: false })
        if (resizingShape.type === 'emitter') updateBlock(resizingShape.id, { emitterWidth: Math.round(width), emitterHeight: Math.round(height), position, fillCanvas: false })
      }
      return
    }
    const width = Math.max(42, resizingShape.width + (fromLeft ? -deltaX : deltaX) / resizingShape.scaleX)
    const height = Math.max(42, resizingShape.height + (fromTop ? -deltaY : deltaY) / resizingShape.scaleY)
    const renderedWidth = width * resizingShape.scaleX
    const renderedHeight = height * resizingShape.scaleY
    const requestedX = resizingShape.position.x + (resizingShape.centerX ? deltaX / rect.width * 50 : fromLeft ? deltaX / rect.width * 100 : 0)
    const requestedY = resizingShape.position.y + (resizingShape.centerY ? deltaY / rect.height * 50 : fromTop ? deltaY / rect.height * 100 : 0)
    const canBleed = ['shape', 'image', 'emitter'].includes(resizingShape.type)
    const widthPercent = renderedWidth / rect.width * 100
    const heightPercent = renderedHeight / rect.height * 100
    const bleedX = canBleed ? Math.min(15, Math.max(6, widthPercent * .45)) : 2
    const bleedY = canBleed ? Math.min(15, Math.max(6, heightPercent * .45)) : 3
    const minX = resizingShape.centerX ? widthPercent / 2 - bleedX : -bleedX
    const maxX = resizingShape.centerX ? 100 + bleedX - widthPercent / 2 : 100 + bleedX - widthPercent
    const minY = resizingShape.centerY ? heightPercent / 2 - bleedY : -bleedY
    const maxY = resizingShape.centerY ? 100 + bleedY - heightPercent / 2 : 100 + bleedY - heightPercent
    const position = { x: Math.max(minX, Math.min(maxX, requestedX)), y: Math.max(minY, Math.min(maxY, requestedY)) }
    if (editingOverrideKey) updateResponsiveBlock(resizingShape.id, editingOverrideKey, { width: Math.round(width), height: Math.round(height), position })
    else {
      if (resizingShape.type === 'shape') updateBlock(resizingShape.id, { shapeWidth: Math.round(width), shapeHeight: Math.round(height), shapeScale: undefined, position })
      if (resizingShape.type === 'image') updateBlock(resizingShape.id, { imageWidth: Math.round(width), imageHeight: Math.round(height), position })
      if (resizingShape.type === 'emitter') updateBlock(resizingShape.id, { emitterWidth: Math.round(width), emitterHeight: Math.round(height), position })
    }
  }
  const endCanvasMove = () => { historyMuted.current = false; setDraggingBlockId(null); setDragOffset(null); setDragStartPositions(null); setResizingShape(null) }
  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (view !== 'builder' || preview || (!event.metaKey && !event.ctrlKey)) return
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]') || target?.isContentEditable) return
      const key = event.key.toLowerCase()
      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      }
      if (key === 'y') { event.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handleHistoryShortcut)
    return () => window.removeEventListener('keydown', handleHistoryShortcut)
  }, [preview, view, workspace])
  const dropOnPage = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault(); const type = event.dataTransfer.getData('application/x-folio-block') as BlockType
    if (isCanvas) { const rect = event.currentTarget.getBoundingClientRect(); const position = { x: Math.max(2, Math.min(78, Math.round((event.clientX - rect.left) / rect.width * 100))), y: Math.max(3, Math.min(83, Math.round((event.clientY - rect.top) / rect.height * 100))) }; if (type in blockInfo) addBlock(type, position) }
    else if (type in blockInfo) addBlock(type)
  }
  const siteName = portfolio.name === 'Mina’s portfolio' ? 'mina.studio' : portfolio.name
  if (!workspaceReady) return <main className="local-account-loading">Loading your Folio workspace…</main>
  if (publicPortfolioId) {
    const publicPortfolio = portfolios.find(item => item.id === publicPortfolioId)
    return publicPortfolio?.publishedAt
      ? <PublishedPortfolio portfolio={publicPortfolio} />
      : <PublicPortfolioUnavailable />
  }
  if (authMode) return <LocalAccountScreen mode={authMode} savedProfile={hasLocalProfile ? workspace.profile : null} onBack={() => setAuthMode(null)} onContinue={() => { window.localStorage.setItem('folio-local-session', 'active'); setSignedIn(true); setAuthMode(null); setView('library') }} onCreate={(name, email) => { const sample = makePortfolio('mina', 'Mina’s portfolio', 'A fully editable example portfolio', '#b8a1ff'); const nextWorkspace = { version: 1 as const, profile: createLocalProfile(name, email), portfolios: [sample], assets: [], activePortfolioId: sample.id }; workspaceRef.current = nextWorkspace; setWorkspaceState(nextWorkspace); resetHistory(); setHasLocalProfile(true); window.localStorage.setItem('folio-local-session', 'active'); setSignedIn(true); setAuthMode(null); setView('library') }} />
  if (view === 'home' || !signedIn || !hasLocalProfile) return <HomeScreen isSignedIn={signedIn && hasLocalProfile} onStart={() => signedIn && hasLocalProfile ? setView('library') : setAuthMode(hasLocalProfile ? 'login' : 'signup')} onLogin={() => setAuthMode('login')} onCredits={() => setView('credits')} onPlans={() => setView('plans')} />
  if (view === 'credits') return <CreditsScreen onBack={() => setView('home')} />
  if (view === 'plans') return <PlansScreen onBack={() => setView('home')} onStart={() => setView('library')} />
  if (view === 'library') return <PortfolioLibrary portfolios={portfolios} profile={workspace.profile} onOpen={openPortfolio} onCreate={createPortfolio} onDelete={deletePortfolio} onSignOut={() => { window.localStorage.removeItem('folio-local-session'); setSignedIn(false); setView('home') }} />

  const togglePreview = () => {
    if (!preview) {
      setPreviewRun(run => run + 1)
    } else {
      // Preview must never carry an in-progress editor gesture back into the canvas.
      setDraggingBlockId(null)
      setDragOffset(null)
      setDragStartPositions(null)
      setResizingShape(null)
      ignoreNextSelectionClick.current = false
    }
    setPreview(value => !value)
  }
  return <main className="studio"><header className="studio-bar"><button className="brand brand-button" onClick={() => setView('library')}><i>✦</i> folio</button><div className="bar-center"><button className={`top-action add-action ${addTrayOpen ? 'active' : ''}`} onClick={() => { setAddTrayView('blocks'); setAddTrayOpen(open => !open) }}><i>+</i> Add <span>⌄</span></button>{!preview && <Drawer label="Layers" icon="☷"><LayerList blocks={page.blocks} selectedId={selectedId} canvas={isCanvas} onSelect={editBlock} onReorder={reorderLayers} /></Drawer>}<Drawer label="Pages" icon="▱"><p className="drawer-kicker">Your portfolio</p>{pages.map((item, index) => <button key={item.id} className={`drawer-page ${item.id === pageId ? 'current' : ''}`} onClick={() => choosePage(item)}><i className={`folder-dot color-${index % 4}`} />{item.name}<span>{item.layout}</span></button>)}<button className="new-page" onClick={addPage}>+ New scroll page</button></Drawer>{!preview && <Drawer label="Settings" icon="⚙"><SettingsPanel portfolio={portfolio} page={page} isHome={pageId === portfolio.homePageId} onPortfolioChange={patch => updatePortfolio(item => ({ ...item, ...patch }))} onPageChange={updatePage} onSetHome={() => updatePortfolio(item => ({ ...item, homePageId: pageId }))} onSetLayout={setLayout} /></Drawer>} {!preview && <Drawer label="More" icon="•••" className="more-drawer"><p className="drawer-kicker">A little help</p><button className="drawer-item tutorial-menu-item" onClick={() => { announcePanel('tutorial'); setTutorialOpen(true) }}><b>?</b><span><strong>Take the tutorial</strong><small>A quick tour of Folio’s essentials</small></span><em>↗</em></button></Drawer>}<span className="bar-divider" />{!preview && <div className="history-controls" role="group" aria-label="Edit history"><button type="button" onClick={undo} disabled={!history.canUndo} title="Undo (⌘Z)" aria-label="Undo">↶</button><button type="button" onClick={redo} disabled={!history.canRedo} title="Redo (⌘⇧Z)" aria-label="Redo">↷</button></div>}</div><div className="bar-actions"><span className={`saved ${saveState === 'error' ? 'save-error' : ''}`}>● {saveState === 'saving' ? 'saving' : saveState === 'error' ? 'save failed' : 'saved locally'}</span>{selected && !preview && <Drawer label="Inspector" icon="⌘" align="right" forceOpen={inspectorOpen}><Inspector block={selected} pages={pages} assets={assets} onChange={patch => updateBlock(selected.id, patch)} onDelete={() => deleteBlock(selected.id)} onLayerMove={direction => moveLayer(selected.id, direction)} onAnchor={anchorCanvasBlock} responsiveRange={responsiveRange} onResponsiveRange={setResponsiveTarget} onResponsiveChange={patch => { if (editingOverrideKey) updateResponsiveBlock(selected.id, editingOverrideKey, patch) }} onClearResponsive={() => { if (editingOverrideKey) clearResponsiveBlock(selected.id, editingOverrideKey) }} /></Drawer>}<button className="preview" onClick={togglePreview}>{preview ? 'Edit site' : 'Preview'}</button>{!preview && <Drawer label={portfolio.publishedAt ? 'Published' : 'Publish'} icon="↗" align="right" className="publish-drawer"><PublishPanel portfolio={portfolio} onPublish={() => updatePortfolio(item => ({ ...item, publishedAt: new Date().toISOString(), updated: 'just now' }))} onUnpublish={() => updatePortfolio(item => ({ ...item, publishedAt: undefined, updated: 'just now' }))} onOpen={() => { window.location.hash = `/p/${portfolio.id}` }} /></Drawer>}</div></header>{!preview && tutorialOpen && <Tutorial onClose={() => setTutorialOpen(false)} />}{!preview && <section className="workspace-context"><span>{isCanvas ? 'Canvas page' : 'Scroll page'} · <b>{page.name}</b></span><div className="device-switcher workspace-device-switcher" role="group" aria-label="Responsive editing device"><span>Editing · {rangeSpecs[responsiveRange].label} · {rangeSpecs[responsiveRange].resolution} preview · {rangeSpecs[responsiveRange].detail}</span>{(Object.keys(rangeSpecs) as ResponsiveRange[]).map(range => <button type="button" key={range} className={responsiveRange === range ? 'active' : ''} onClick={() => setResponsiveTarget(range)}>{rangeSpecs[range].label}</button>)}</div></section>}
    <aside className={`add-tray ${addTrayOpen ? 'open' : ''}`}><div className="tray-heading"><div><strong>{addTrayView === 'assets' ? 'Your asset shelf' : 'Building blocks'}</strong><span>{addTrayView === 'assets' ? 'Keep your images and type close to the work.' : `Drag onto your ${isCanvas ? 'canvas' : 'page'} or click to add`}</span></div><div className="tray-view-tabs" role="tablist"><button type="button" className={addTrayView === 'blocks' ? 'active' : ''} onClick={() => setAddTrayView('blocks')}>▦ Blocks</button><button type="button" className={addTrayView === 'assets' ? 'active' : ''} onClick={() => setAddTrayView('assets')}>▤ Assets <i>{assets.length}</i></button></div><button onClick={() => setAddTrayOpen(false)}>Close ×</button></div><div className="tray-items">{addTrayView === 'blocks' ? <>{trayGroups.map(group => <section className="tray-section" key={group.title}><header><strong>{group.title}</strong><small>{group.note}</small></header><div className="tray-section-items">{group.types.map(type => <button draggable key={type} className="tray-card" onClick={() => addBlock(type)} onDragStart={event => event.dataTransfer.setData('application/x-folio-block', type)}><b>{blockInfo[type].icon}</b><strong>{blockInfo[type].label}</strong><small>{blockInfo[type].description}</small><em>Drag</em></button>)}</div></section>)}{copiedBlock && <section className="tray-section tray-paste"><header><strong>Clipboard</strong><small>Use the block you copied.</small></header><div className="tray-section-items"><button className="tray-card paste-card" onClick={pasteCopiedBlock}><b>▣</b><strong>Paste block</strong><small>Use your copied {blockInfo[copiedBlock.type].label.toLowerCase()}</small></button></div></section>}</> : <AssetShelf embedded assets={assets} selected={selected} onAdd={addAsset} onUseImage={useImageAsset} onUseFont={useFontAsset} onClose={() => setAddTrayView('blocks')} />}</div></aside>
    {!preview && <div className="file-tabs">{pages.map((item, index) => <button key={item.id} className={`file-tab ${item.id === pageId ? 'active' : ''} file-${index % 4}`} onClick={() => choosePage(item)}><span>●</span>{item.name}</button>)}<button className="tab-add" onClick={addPage}>+</button></div>}
    <section className={`site-stage ${preview ? `previewing device-${rangeSpecs[responsiveRange].frame}` : `editing device-${rangeSpecs[responsiveRange].frame}`}`}><article key={`${page.id}-${preview ? `preview-${previewRun}` : 'editor'}`} className={`site ${page.showHeader ? '' : 'site-without-header'}`} style={pageBackgroundStyle(page.background)}>{page.showHeader && <nav className={`site-nav nav-transition-${page.transition}`}>{portfolio.showPortfolioName && <button className="site-brand" onClick={() => choosePage(pages.find(item => item.id === portfolio.homePageId) ?? page)}>{siteName}</button>}<div>{pages.filter(item => item.showInNav).map(item => <button className={item.id === pageId ? 'current' : ''} key={item.id} onClick={() => choosePage(item)}>{item.name}</button>)}</div><span className="menu-mark">☼</span></nav>}<div className={`site-content page-transition-${page.transition} page-layout-${page.layout} ${draggingBlockId || resizingShape ? 'is-dragging' : ''}`} onPointerMove={event => { moveCanvasBlock(event); resizeCanvasShape(event) }} onPointerUp={endCanvasMove} onPointerCancel={endCanvasMove} onDragOver={event => event.preventDefault()} onDrop={dropOnPage} onClick={event => { if (!preview && event.target === event.currentTarget) clearSelection() }}>{page.blocks.map(block => <BlockView key={block.id} block={block} canvas={isCanvas} preview={preview} range={responsiveRange} active={!preview && selectedIds.includes(block.id)} onClick={() => !preview && selectBlock(block.id)} onChange={patch => updateBlock(block.id, patch)} onEdit={() => editBlock(block.id)} onDuplicate={() => duplicateBlock(block.id)} onCopy={() => setCopiedBlock(block)} onDelete={() => deleteBlock(block.id)} onNavigate={targetId => choosePage(pages.find(item => item.id === targetId) ?? page)} onMoveStart={event => startCanvasMove(event, block.id)} onResizeStart={(event, corner) => startShapeResize(event, block.id, corner)} />)}{!preview && !isCanvas && <button className="inline-add" onClick={() => addBlock('text')}>+ add section</button>}{!preview && isCanvas && page.blocks.length === 0 && <p className="canvas-hint">Shift-click blocks to select more than one, then drag them together.</p>}</div><footer className={`site-footer ${isCanvas ? 'canvas-footer' : ''}`}><span>folio</span></footer></article></section>
  </main>
}

function PortfolioLibrary({ portfolios, profile, onOpen, onCreate, onDelete, onSignOut }: { portfolios: Portfolio[]; profile: LocalWorkspace['profile']; onOpen: (item: Portfolio) => void; onCreate: () => void; onDelete: (id: string) => void; onSignOut: () => void }) {
  const limitReached = portfolios.length >= 3
  const [pendingDeletion, setPendingDeletion] = useState<Portfolio | null>(null)
  return <main className="library-screen"><header className="library-header"><div className="brand"><i>✦</i> folio</div><div className="library-account"><span>{profile.name} · local workspace</span><button onClick={onSignOut}>Sign out</button></div></header><section className="library-content"><p className="library-eyebrow">YOUR PORTFOLIOS · FREE PLAN {portfolios.length}/3</p><h1>Every body of work<br />deserves its own home.</h1><p className="library-intro">This browser saves your work automatically. Open a portfolio to keep shaping it, or start a fresh new world.</p><div className="portfolio-grid">{portfolios.map(item => <article className="portfolio-card" key={item.id}><button className="portfolio-open" onClick={() => onOpen(item)} aria-label={`Open ${item.name}`}><div className="portfolio-cover" style={{ background: `linear-gradient(135deg, ${item.color}, #fff0cf)` }}><span>✦</span><small>OPEN ↗</small></div><div><strong>{item.name}</strong><p>{item.description}</p><span>Saved on this device</span></div></button><button className="portfolio-delete" type="button" aria-label={`Delete ${item.name}`} title="Delete portfolio" onClick={() => setPendingDeletion(item)}>⌫</button></article>)}<button className="new-portfolio-card" onClick={onCreate} disabled={limitReached}><span className="new-plus">+</span><strong>{limitReached ? 'Your free shelf is full' : 'Make a new portfolio'}</strong><small>{limitReached ? 'Free includes up to 3 portfolios' : `${3 - portfolios.length} free portfolio${3 - portfolios.length === 1 ? '' : 's'} left`}</small></button></div></section>{pendingDeletion && <div className="delete-dialog-backdrop" role="presentation" onMouseDown={() => setPendingDeletion(null)}><section className="delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-portfolio-title" aria-describedby="delete-portfolio-description" onMouseDown={event => event.stopPropagation()}><span className="delete-dialog-icon">⌫</span><p>DELETE PORTFOLIO</p><h2 id="delete-portfolio-title">Delete “{pendingDeletion.name}”?</h2><span id="delete-portfolio-description">This removes the portfolio and all of its pages from this browser. It can’t be undone.</span><div><button type="button" onClick={() => setPendingDeletion(null)}>Keep it</button><button className="confirm-delete" type="button" onClick={() => { onDelete(pendingDeletion.id); setPendingDeletion(null) }}>Delete portfolio</button></div></section></div>}</main>
}
function Tutorial({ onClose }: { onClose: () => void }) {
  const steps = [
    { eyebrow: '01 · BEGIN WITH A PAGE', icon: '▱', title: 'Choose the kind of space you need.', body: 'Use Pages to create and switch between your portfolio pages. Canvas gives you a freeform artboard; Scroll keeps content in a tidy reading flow.', note: 'Tip: Make the page visitors should see first your Home page in Settings.' },
    { eyebrow: '02 · BUILD', icon: '+', title: 'Add a block, then make it yours.', body: 'Open Add for text, images, buttons, projects, embeds, and playful details. Click a card to add it, or drag it onto a canvas page.', note: 'Your images and uploaded fonts live in Add → Assets.' },
    { eyebrow: '03 · COMPOSE', icon: '✣', title: 'Move things with your hands.', body: 'On a canvas page, click a block and drag it into place. Drag its corners to resize shapes, images, and emitters. Hold Shift while clicking to move several blocks together.', note: 'Use Layers when something needs to sit in front or behind.' },
    { eyebrow: '04 · REFINE', icon: '⌘', title: 'The Inspector is where details happen.', body: 'Select an element, then open Inspector to change its type, spacing, colors, typography, links, animation, and layer order. Text can also be edited right on the page.', note: 'Choose Tablet or Phone in the device controls to make targeted adjustments.' },
    { eyebrow: '05 · SHARE', icon: '↗', title: 'Preview it like a visitor would.', body: 'Preview removes editor controls so you can check the real experience at different device sizes. When it feels ready, Publish creates this prototype’s local visitor view.', note: 'Your work saves automatically on this device.' },
  ]
  const [step, setStep] = useState(0)
  const current = steps[step]
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
  return <div className="tutorial-backdrop" role="presentation" onMouseDown={onClose}><section className="tutorial-dialog" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" onMouseDown={event => event.stopPropagation()}><button className="tutorial-close" type="button" aria-label="Close tutorial" onClick={onClose}>×</button><div className="tutorial-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((item, index) => <i className={index === step ? 'current' : index < step ? 'complete' : ''} key={item.eyebrow} />)}</div><div className="tutorial-icon">{current.icon}</div><p>{current.eyebrow}</p><h2 id="tutorial-title">{current.title}</h2><span>{current.body}</span><aside><b>Good to know</b>{current.note}</aside><footer><button type="button" className="tutorial-back" disabled={step === 0} onClick={() => setStep(index => index - 1)}>← Back</button><span>{step + 1} / {steps.length}</span>{step === steps.length - 1 ? <button type="button" className="tutorial-next" onClick={onClose}>Start making ↗</button> : <button type="button" className="tutorial-next" onClick={() => setStep(index => index + 1)}>Next →</button>}</footer></section></div>
}
function Drawer({ label, icon, align, forceOpen = 0, className = '', children }: { label: string; icon: string; align?: 'right'; forceOpen?: number; className?: string; children: ReactNode }) {
  const [id] = useState(() => makeId('drawer'))
  const drawerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const lastForceOpen = useRef(0)

  useEffect(() => {
    const closeWhenAnotherPanelOpens = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) setOpen(false)
    }
    window.addEventListener(PANEL_EVENT, closeWhenAnotherPanelOpens)
    return () => window.removeEventListener(PANEL_EVENT, closeWhenAnotherPanelOpens)
  }, [id])

  useEffect(() => {
    if (forceOpen > 0 && forceOpen !== lastForceOpen.current) {
      setOpen(true)
      announcePanel(id)
    }
    lastForceOpen.current = forceOpen
  }, [forceOpen, id])

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!drawerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePress)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress)
  }, [])

  const toggle = () => setOpen(current => {
    const next = !current
    if (next) announcePanel(id)
    return next
  })

  return <div ref={drawerRef} className={`drawer ${className} ${align === 'right' ? 'drawer-right' : ''} ${open ? 'open' : ''}`}><button type="button" className="drawer-trigger" aria-expanded={open} onClick={toggle}><i>{icon}</i>{label}<span>⌄</span></button><div className="drawer-panel">{children}</div></div>
}
function PublishPanel({ portfolio, onPublish, onUnpublish, onOpen }: { portfolio: Portfolio; onPublish: () => void; onUnpublish: () => void; onOpen: () => void }) {
  const [copied, setCopied] = useState(false)
  const link = publicPortfolioUrl(portfolio.id)
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }
  if (!portfolio.publishedAt) return <div className="publish-panel"><p className="drawer-kicker">Ready when you are</p><h2>Publish this portfolio</h2><p>Turn your current work into a visitor-only portfolio page. You can unpublish it any time.</p><button type="button" className="publish-primary" onClick={onPublish}>Publish portfolio ↗</button><small>This prototype creates a local public link. Real online sharing arrives with accounts and hosting.</small></div>
  return <div className="publish-panel"><p className="drawer-kicker published-kicker">● Published</p><h2>It’s ready to share.</h2><p>Your public portfolio has its own visitor view, with no editor controls.</p><label className="publish-link"><span>Share link</span><input readOnly value={link} aria-label="Portfolio share link" onFocus={event => event.currentTarget.select()} /></label><div className="publish-actions"><button type="button" className="publish-primary" onClick={copyLink}>{copied ? 'Copied!' : 'Copy link'}</button><button type="button" onClick={onOpen}>Open site ↗</button></div><button type="button" className="unpublish" onClick={onUnpublish}>Unpublish portfolio</button><small>For now, this link works in this browser only. Supabase + hosting will make it genuinely public.</small></div>
}
function PublicPortfolioUnavailable() {
  return <main className="public-unavailable"><div><i>✦</i><p>FOLIO PORTFOLIO</p><h1>This portfolio isn’t available.</h1><span>It may have been unpublished, or this local prototype does not have access to it.</span></div></main>
}
function PublishedPortfolio({ portfolio }: { portfolio: Portfolio }) {
  const [pageId, setPageId] = useState(portfolio.homePageId)
  const [range, setRange] = useState<ResponsiveRange>(rangeForViewport)
  useEffect(() => {
    const syncRange = () => setRange(rangeForViewport())
    window.addEventListener('resize', syncRange)
    return () => window.removeEventListener('resize', syncRange)
  }, [])
  const page = portfolio.pages.find(item => item.id === pageId) ?? portfolio.pages[0]
  const siteName = portfolio.name === 'Mina’s portfolio' ? 'mina.studio' : portfolio.name
  const motion = portfolio.pages.flatMap(item => item.blocks.map(block => motionCss(block.id, block.type, { entrance: block.animation, delay: block.animationDelay ?? 0, duration: block.animationDuration ?? .55, loop: block.loopAnimation ?? 'none' }))).join('')
  const choosePage = (nextId: string) => { setPageId(nextId); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const noOp = () => undefined
  return <main className="published-portfolio"><style>{motion}</style><article key={page.id} className={`site ${page.showHeader ? '' : 'site-without-header'}`} style={pageBackgroundStyle(page.background)}>{page.showHeader && <nav className={`site-nav nav-transition-${page.transition}`}>{portfolio.showPortfolioName && <button className="site-brand" onClick={() => choosePage(portfolio.homePageId)}>{siteName}</button>}<div>{portfolio.pages.filter(item => item.showInNav).map(item => <button className={item.id === page.id ? 'current' : ''} key={item.id} onClick={() => choosePage(item.id)}>{item.name}</button>)}</div><span className="menu-mark">☼</span></nav>}<div className={`site-content page-transition-${page.transition} page-layout-${page.layout}`}>{page.blocks.map(block => <BlockView key={block.id} block={block} canvas={page.layout === 'canvas'} preview range={range} active={false} onClick={noOp} onChange={noOp} onEdit={noOp} onDuplicate={noOp} onCopy={noOp} onDelete={noOp} onNavigate={choosePage} onMoveStart={noOp} onResizeStart={noOp} />)}</div><footer className={`site-footer ${page.layout === 'canvas' ? 'canvas-footer' : ''}`}><span>folio</span></footer></article></main>
}
function AssetShelf({ assets, selected, onAdd, onUseImage, onUseFont, embedded = false, onClose }: { assets: Asset[]; selected?: Block; onAdd: (asset: Asset) => void; onUseImage: (asset: Asset) => void; onUseFont: (asset: Asset) => void; embedded?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(embedded)
  const [category, setCategory] = useState<AssetKind>('image')
  const [error, setError] = useState('')
  const [id] = useState('asset-shelf')
  const shelfRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const closeWhenAnotherPanelOpens = (event: Event) => {
      if (!embedded && (event as CustomEvent<string>).detail !== id) setOpen(false)
    }
    window.addEventListener(PANEL_EVENT, closeWhenAnotherPanelOpens)
    return () => window.removeEventListener(PANEL_EVENT, closeWhenAnotherPanelOpens)
  }, [embedded, id])
  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!embedded && !shelfRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePress)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress)
  }, [embedded])
  const toggle = () => setOpen(current => {
    const next = !current
    if (next) announcePanel(id)
    return next
  })
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const extension = file.name.split('.').pop()?.toLowerCase()
    const kind: AssetKind | null = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg'].includes(extension ?? '') ? 'image' : ['woff2', 'woff', 'ttf', 'otf'].includes(extension ?? '') ? 'font' : null
    const limit = kind === 'font' ? MAX_FONT_FILE_SIZE : MAX_IMAGE_FILE_SIZE
    if (!kind) { setError('Choose an image or a font file (WOFF2, WOFF, TTF, or OTF).'); return }
    if (file.size > limit) { setError(`${kind === 'font' ? 'Fonts' : 'Images'} must be smaller than ${kind === 'font' ? '5' : '10'} MB.`); return }
    const reader = new FileReader()
    reader.onload = () => { const id = makeId('asset'); onAdd({ id, name: file.name, kind, dataUrl: String(reader.result), family: kind === 'font' ? `Folio upload ${id}` : undefined }); setCategory(kind); setError('') }
    reader.onerror = () => setError('That file could not be read. Please try another one.')
    reader.readAsDataURL(file)
  }
  const visibleAssets = assets.filter(asset => asset.kind === category)
  const selectionHint = category === 'image' ? selected?.type === 'image' ? 'Choose an image to place it in the selected block.' : 'Select an Image block first, then choose an image.' : selected?.type === 'text' ? 'Choose a font to apply it to the selected text.' : 'Select a Text block first, then choose a font.'
  return <aside ref={shelfRef} className={`asset-shelf ${embedded ? 'embedded' : ''} ${open || embedded ? 'open' : ''}`}>{!embedded && <button type="button" className="asset-shelf-trigger" onClick={toggle}><span>▤</span> Asset shelf <i>{open ? '×' : '⌃'}</i></button>}{(open || embedded) && <div className="asset-shelf-panel"><header><div><p>ASSET SHELF</p><h2>Your little library.</h2></div><button type="button" onClick={() => embedded ? onClose?.() : setOpen(false)} aria-label="Close asset shelf">×</button></header><div className="asset-tabs" role="tablist"><button type="button" className={category === 'image' ? 'active' : ''} onClick={() => setCategory('image')}>Images <span>{assets.filter(asset => asset.kind === 'image').length}</span></button><button type="button" className={category === 'font' ? 'active' : ''} onClick={() => setCategory('font')}>Fonts <span>{assets.filter(asset => asset.kind === 'font').length}</span></button></div><label className="asset-upload"><input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,.woff2,.woff,.ttf,.otf" onChange={upload} /><b>+ Upload {category === 'image' ? 'image' : 'font'}</b><small>{category === 'image' ? 'PNG, JPG, GIF, WebP, SVG · up to 10 MB' : 'WOFF2, WOFF, TTF, OTF · up to 5 MB'}</small></label><p className="asset-rights">By uploading, you confirm that you own this file or have permission to publish it. Don’t upload copyrighted images or fonts you are not licensed to use.</p>{error && <p className="asset-error">{error}</p>}<p className="asset-selection-hint">{selectionHint}</p><div className="asset-list">{visibleAssets.length === 0 ? <p className="asset-empty">Nothing on this shelf yet.</p> : visibleAssets.map(asset => <button type="button" key={asset.id} className="asset-row" onClick={() => asset.kind === 'image' ? onUseImage(asset) : onUseFont(asset)} disabled={asset.kind === 'image' ? selected?.type !== 'image' : selected?.type !== 'text'}>{asset.kind === 'image' ? <span className="asset-thumbnail" style={{ backgroundImage: `url("${asset.dataUrl}")` }} /> : <span className="asset-font-sample" style={{ fontFamily: fontStack(asset.family ?? 'DM Sans') }}>Aa</span>}<span><b>{asset.name.replace(/\.[^.]+$/, '')}</b><small>{asset.kind === 'image' ? 'Use in selected image' : 'Use on selected text'}</small></span><i>↗</i></button>)}</div></div>}</aside>
}
function LayerList({ blocks, selectedId, canvas, onSelect, onReorder }: { blocks: Block[]; selectedId: string; canvas: boolean; onSelect: (id: string) => void; onReorder: (draggedId: string, targetId: string) => void }) { const [draggedId, setDraggedId] = useState<string | null>(null); const [reorderedId, setReorderedId] = useState<string | null>(null); const ordered = blocks.map((block, index) => ({ block, order: block.zIndex ?? index + 1 })).sort((a, b) => b.order - a.order).map(item => item.block); const preview = (block: Block) => block.type === 'project' ? block.title ?? 'Untitled project' : block.type === 'quote' ? `“${block.content}”` : block.content; const completeReorder = (targetId: string) => { if (!draggedId || draggedId === targetId) { setDraggedId(null); return } onReorder(draggedId, targetId); setReorderedId(draggedId); setDraggedId(null); window.setTimeout(() => setReorderedId(current => current === draggedId ? null : current), 240) }; return <div className="layer-list"><p className="drawer-kicker">{canvas ? 'Canvas layers' : 'Page order'} · {blocks.length} item{blocks.length === 1 ? '' : 's'}</p><p className="layer-help">Top is in front. Drag to reorder; use the selected element’s Inspector for layer steps.</p>{blocks.length === 0 ? <p className="element-empty">Nothing here yet. Add a block to get started.</p> : ordered.map((block, index) => <div key={block.id} draggable className={`layer-row ${block.id === selectedId ? 'current' : ''} ${draggedId === block.id ? 'dragging' : ''} ${reorderedId === block.id ? 'reordered' : ''}`} onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; setDraggedId(block.id) }} onDragEnd={() => setDraggedId(null)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); completeReorder(block.id) }}><button className="layer-select" onClick={() => onSelect(block.id)}><span className="layer-grip">⠿</span><span className="element-icon">{blockInfo[block.type].icon}</span><span><b>{blockInfo[block.type].label}</b><small>{preview(block)}</small></span><em>{index === 0 ? 'front' : String(index + 1).padStart(2, '0')}</em></button></div>)}</div> }
function SettingsPanel({ portfolio, page, isHome, onPortfolioChange, onPageChange, onSetHome, onSetLayout }: { portfolio: Portfolio; page: Page; isHome: boolean; onPortfolioChange: (patch: Partial<Portfolio>) => void; onPageChange: (patch: Partial<Page>) => void; onSetHome: () => void; onSetLayout: (layout: LayoutMode) => void }) { const [section, setSection] = useState<'portfolio' | 'page'>('page'); return <div className="settings-panel"><div className="settings-tabs" role="tablist"><button type="button" className={section === 'page' ? 'active' : ''} onClick={() => setSection('page')}>This page</button><button type="button" className={section === 'portfolio' ? 'active' : ''} onClick={() => setSection('portfolio')}>Portfolio</button></div>{section === 'portfolio' ? <PortfolioSettings portfolio={portfolio} onChange={onPortfolioChange} /> : <PageSettings page={page} isHome={isHome} onChange={onPageChange} onSetHome={onSetHome} onSetLayout={onSetLayout} />}</div> }
function PortfolioSettings({ portfolio, onChange }: { portfolio: Portfolio; onChange: (patch: Partial<Portfolio>) => void }) { return <div className="portfolio-settings"><p className="drawer-kicker">Portfolio settings</p><Field label="Portfolio name" value={portfolio.name} onChange={name => onChange({ name: name || 'Untitled portfolio' })} /><p className="portfolio-name-note">Shown on pages where both the website header and portfolio name are enabled.</p><label className="setting-toggle"><input type="checkbox" checked={portfolio.showPortfolioName} onChange={event => onChange({ showPortfolioName: event.target.checked })} /><span><b>Show portfolio name</b><small>Display your name on the left of enabled page headers</small></span></label></div> }
function PageSettings({ page, isHome, onChange, onSetHome, onSetLayout }: { page: Page; isHome: boolean; onChange: (patch: Partial<Page>) => void; onSetHome: () => void; onSetLayout: (layout: LayoutMode) => void }) {
  const background = page.background
  const canvasHeight = page.canvasHeight ?? 900
  const updateBackground = (patch: Partial<PageBackground>) => onChange({ background: { ...background, ...patch } })
  return <div className="page-settings"><p className="drawer-kicker">Page settings</p><Field label="Page name" value={page.name} onChange={name => onChange({ name })} /><Field label="URL path" value={page.slug} onChange={slug => onChange({ slug: slug.replace(/^\/+/, '').replace(/\s+/g, '-').toLowerCase() })} /><p className="path-preview">yourname.folio.page{page.slug ? `/${page.slug}` : ''}</p><label className="field"><span>Page format</span><select value={page.layout} onChange={event => onSetLayout(event.target.value as LayoutMode)}><option value="canvas">Canvas — free placement</option><option value="scroll">Scroll — structured flow</option></select></label>{page.layout === 'canvas' && <label className="field canvas-height-control"><span>Canvas height · {canvasHeight}px</span><input type="range" min="700" max="2400" step="100" value={canvasHeight} onChange={event => onChange({ canvasHeight: Number(event.target.value) })} /><small>Extend the page for more room. Limited to 2,400px to keep portfolios fast.</small></label>}<label className="field"><span>Page transition</span><select value={page.transition} onChange={event => onChange({ transition: event.target.value as PageTransition })}><option value="lift">Lift in</option><option value="slide">Slide across</option><option value="fade">Soft fade</option></select></label><div className="background-settings"><span>Page background</span><label className="field"><span>Background type</span><select value={background.type} onChange={event => updateBackground({ type: event.target.value as BackgroundType })}><option value="color">Solid color</option><option value="gradient">Color gradient</option><option value="image">Image</option></select></label>{background.type === 'color' && <label className="field"><span>Page color</span><input type="color" value={background.color} onChange={event => updateBackground({ color: event.target.value })} /></label>}{background.type === 'gradient' && <><div className="color-pair"><label className="field"><span>Start</span><input type="color" value={background.gradientStart} onChange={event => updateBackground({ gradientStart: event.target.value })} /></label><label className="field"><span>End</span><input type="color" value={background.gradientEnd} onChange={event => updateBackground({ gradientEnd: event.target.value })} /></label></div><label className="field"><span>Angle · {background.gradientAngle}°</span><input type="range" min="0" max="360" value={background.gradientAngle} onChange={event => updateBackground({ gradientAngle: Number(event.target.value) })} /></label></>}{background.type === 'image' && <><Field label="Image URL" value={background.imageUrl} onChange={imageUrl => updateBackground({ imageUrl })} /><label className="field"><span>Image scaling</span><select value={background.imageFit} onChange={event => updateBackground({ imageFit: event.target.value as ImageFit })}><option value="cover">Crop to fill</option><option value="contain">Fit whole image</option><option value="stretch">Stretch to fit</option><option value="repeat">Repeat as pattern</option></select></label><p className="background-note">Use a direct image link for now. Uploading images will come with the real publishing system.</p></>}</div><label className="setting-toggle"><input type="checkbox" checked={isHome} onChange={onSetHome} /><span><b>Home page</b><small>Visitors land here first</small></span></label><label className="setting-toggle"><input type="checkbox" checked={page.showHeader} onChange={event => onChange({ showHeader: event.target.checked })} /><span><b>Show website header</b><small>Show this page’s navigation bar and portfolio name</small></span></label><label className="setting-toggle"><input type="checkbox" checked={page.showInNav} onChange={event => onChange({ showInNav: event.target.checked })} /><span><b>Show in navigation</b><small>Add this page to your menu</small></span></label></div>
}
export default App
