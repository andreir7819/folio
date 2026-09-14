import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import './App.css'
import './font-library.css'
import './page-background.css'
import './editor-polish.css'
import './building-blocks.css'
import './button-settings.css'
import './portfolio-library.css'
import './tutorial.css'
import { motionCss } from './motion'
import MediaEmbed, { EmbedSettings } from './MediaEmbed'
import HomeScreen from './HomeScreen'
import CreditsScreen from './CreditsScreen'
import PlansScreen from './PlansScreen'
import { createMinaPages } from './minaPortfolio'
import LocalAccountScreen from './LocalAccountScreen'
import { createLocalProfile, loadLocalWorkspace, saveLocalWorkspace, type LocalWorkspace } from './localWorkspace'

export type { Asset, Block, Page, Portfolio }

type BlockType = 'audio' | 'video' | 'text' | 'body' | 'image' | 'button' | 'project' | 'gallery' | 'projectGrid' | 'links' | 'quote' | 'shape' | 'emitter'
type Animation = 'none' | 'fade' | 'rise' | 'pop'
type LoopAnimation = 'none' | 'float' | 'spin' | 'pulse' | 'wiggle'
type FontStyle = string
type PageTransition = 'fade' | 'slide' | 'lift'
type LayoutMode = 'canvas' | 'scroll'
type Position = { x: number; y: number }
type BackgroundType = 'color' | 'gradient' | 'image'
type ImageFit = 'cover' | 'contain' | 'stretch' | 'repeat'
type DeviceMode = 'desktop' | 'laptop' | 'tablet' | 'phone'
type ResponsiveRange = 'wide' | 'medium' | 'compact'
type ResponsiveOverrideKey = 'tablet' | 'phone'
type CanvasAnchorX = 'left' | 'center' | 'right'
type CanvasAnchorY = 'top' | 'center' | 'bottom'
type ButtonVariant = 'solid' | 'soft' | 'outline' | 'text'
type ButtonSize = 'small' | 'medium' | 'large'
type ButtonCorner = 'sharp' | 'soft' | 'pill'
type ButtonLinkType = 'none' | 'page' | 'url'
type ShapeType = 'circle' | 'square' | 'rounded' | 'triangle' | 'diamond' | 'star' | 'pill'
type ResizeCorner = 'nw' | 'ne' | 'se' | 'sw'
type ShapeResize = { id: string; type: 'shape' | 'image' | 'emitter'; corner: ResizeCorner; startX: number; startY: number; width: number; height: number; scaleX: number; scaleY: number; position: Position; centerX: boolean; centerY: boolean; anchorX?: CanvasAnchorX; anchorY?: CanvasAnchorY; left?: number; top?: number; right?: number; bottom?: number }
type DragStartPositions = Record<string, Position>
type ParticleStyle = 'dots' | 'stars' | 'confetti'
type AssetKind = 'image' | 'font'
type Asset = { id: string; name: string; kind: AssetKind; dataUrl: string; family?: string }
type ResponsiveOverride = { hidden?: boolean; position?: Position; width?: number; height?: number; textSize?: number; centerX?: boolean; centerY?: boolean; anchorX?: CanvasAnchorX; anchorY?: CanvasAnchorY }
type Block = { id: string; type: BlockType; content: string; title?: string; subtitle?: string; imageUrl?: string; imageAlt?: string; imageWidth?: number; imageHeight?: number; imageBorderStyle?: 'none' | 'solid' | 'gradient'; imageBorderWidth?: number; imageBorderColor?: string; imageBorderStart?: string; imageBorderEnd?: string; imageBorderAngle?: number; imageRadius?: number; imageOpacity?: number; imageFade?: 'none' | 'top' | 'bottom' | 'left' | 'right'; emitterWidth?: number; emitterHeight?: number; fillCanvas?: boolean; particleStyle?: ParticleStyle; particleDensity?: number; animation: Animation; animationDelay?: number; animationDuration?: number; loopAnimation?: LoopAnimation; accent?: string; font?: FontStyle; textAlign?: 'left' | 'center' | 'right'; textSize?: number; textWeight?: number; textLineHeight?: number; textLetterSpacing?: number; textColor?: string; textShadowEnabled?: boolean; textShadowColor?: string; textShadowX?: number; textShadowY?: number; textShadowBlur?: number; textShadowOpacity?: number; textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'; textItalic?: boolean; position?: Position; centerX?: boolean; centerY?: boolean; anchorX?: CanvasAnchorX; anchorY?: CanvasAnchorY; zIndex?: number; responsive?: Partial<Record<ResponsiveOverrideKey, ResponsiveOverride>>; buttonVariant?: ButtonVariant; buttonSize?: ButtonSize; buttonCorner?: ButtonCorner; buttonTextColor?: string; showButtonArrow?: boolean; buttonLinkType?: ButtonLinkType; buttonPageId?: string; buttonUrl?: string; shapeType?: ShapeType; shapeScale?: number; shapeWidth?: number; shapeHeight?: number }
type PageBackground = { type: BackgroundType; color: string; gradientStart: string; gradientEnd: string; gradientAngle: number; imageUrl: string; imageFit: ImageFit }
type Page = { id: string; name: string; slug: string; showHeader: boolean; showInNav: boolean; transition: PageTransition; layout: LayoutMode; canvasHeight?: number; background: PageBackground; blocks: Block[] }
type Portfolio = { id: string; name: string; description: string; color: string; showPortfolioName: boolean; pages: Page[]; homePageId: string; updated: string; publishedAt?: string }

const blockInfo: Record<BlockType, { icon: string; label: string; description: string }> = {
  audio: { icon: '♫', label: 'Audio embed', description: 'Music and podcasts, by link' }, video: { icon: '▷', label: 'Video embed', description: 'Films and demos, by link' },
  text: { icon: 'T', label: 'Text', description: 'A big point of view' }, body: { icon: '¶', label: 'Rich text', description: 'A fuller explanation' }, image: { icon: '▧', label: 'Image', description: 'A visual moment' }, button: { icon: '↗', label: 'Button', description: 'A clear next step' }, project: { icon: '✦', label: 'Project card', description: 'Show your work' }, gallery: { icon: '▦', label: 'Gallery', description: 'A small visual collection' }, projectGrid: { icon: '▤', label: 'Project grid', description: 'Three projects at once' }, links: { icon: '↗', label: 'Link list', description: 'Your places online' }, quote: { icon: '“', label: 'Quote', description: 'A pull quote or praise' }, shape: { icon: '●', label: 'Shape', description: 'A playful accent' }, emitter: { icon: '✺', label: 'Particle emitter', description: 'A little ambient motion' },
}
const trayGroups: { title: string; note: string; types: BlockType[] }[] = [
  { title: 'Start with content', note: 'The essentials for a page with a point of view.', types: ['text', 'body', 'image', 'button'] },
  { title: 'Show your work', note: 'Structured ways to present projects and places online.', types: ['project', 'gallery', 'projectGrid', 'links', 'quote'] },
  { title: 'Sound & video', note: 'Bring in media with a link.', types: ['audio', 'video'] },
  { title: 'Make it feel alive', note: 'Decorative details for a more expressive canvas.', types: ['shape', 'emitter'] },
]
const MAX_BLOCKS_PER_PAGE = 50
const MAX_HISTORY_STEPS = 80
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024
const MAX_FONT_FILE_SIZE = 5 * 1024 * 1024
const rangeSpecs: Record<ResponsiveRange, { label: string; detail: string; resolution: string; frame: DeviceMode; overrideKey?: ResponsiveOverrideKey }> = {
  wide: { label: 'Wide', detail: '1024px and up', resolution: '1440 × 900', frame: 'laptop' },
  medium: { label: 'Medium', detail: '600–1023px', resolution: '768 × 1024', frame: 'tablet', overrideKey: 'tablet' },
  compact: { label: 'Compact', detail: 'under 600px', resolution: '390 × 844', frame: 'phone', overrideKey: 'phone' },
}
// Canvas sizes are authored against the representative Wide workspace.
// They render in container units, not screen-specific pixel multipliers.
const CANVAS_REFERENCE_WIDTH = 1440
const rangeForViewport = (): ResponsiveRange => {
  if (typeof window === 'undefined') return 'wide'
  if (window.innerWidth < 600) return 'compact'
  if (window.innerWidth < 1024) return 'medium'
  return 'wide'
}
const physicalAnchorPercent = (offset: number, anchor: CanvasAnchorX | CanvasAnchorY) => anchor === 'right' || anchor === 'bottom' ? 100 - offset : anchor === 'center' ? 50 + offset : offset
const offsetFromPhysicalPercent = (position: number, anchor: CanvasAnchorX | CanvasAnchorY) => anchor === 'right' || anchor === 'bottom' ? 100 - position : anchor === 'center' ? position - 50 : position
const colorWithOpacity = (color: string, opacity: number) => {
  const value = color.replace('#', '')
  const hex = value.length === 3 ? value.split('').map(part => part + part).join('') : value
  if (!/^[0-9a-f]{6}$/i.test(hex)) return color
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  return `rgb(${red} ${green} ${blue} / ${Math.max(0, Math.min(100, opacity)) / 100})`
}
const PANEL_EVENT = 'folio-panel-open'
const announcePanel = (id: string) => window.dispatchEvent(new CustomEvent<string>(PANEL_EVENT, { detail: id }))
const featuredFonts = [
  ['editorial', 'Playfair Display', 'Editorial'], ['sans', 'DM Sans', 'Clean sans'], ['mono', 'DM Mono', 'Mono'], ['playful', 'DM Sans', 'Playful'], ['script', 'Playfair Display', 'Italic serif'], ['grotesk', 'Space Grotesk', 'Grotesk'], ['soft', 'Fraunces', 'Soft serif'], ['modern', 'Manrope', 'Modern'], ['display', 'Archivo Black', 'Display'],
] as const
const fontCatalog = [
  'ABeeZee', 'Abril Fatface', 'Acme', 'Alata', 'Albert Sans', 'Alegreya', 'Alegreya Sans', 'Alfa Slab One', 'Amatic SC', 'Anton', 'Anybody', 'Arimo', 'Archivo', 'Archivo Black', 'Archivo Narrow', 'Arvo', 'Asap', 'Assistant', 'Atkinson Hyperlegible', 'Audiowide', 'B612', 'Bangers', 'Barlow', 'Barlow Condensed', 'Bebas Neue', 'Bitter', 'Bodoni Moda', 'Borel', 'Bree Serif', 'Cabin', 'Cairo', 'Candal', 'Cardo', 'Caveat', 'Chakra Petch', 'Chivo', 'Cinzel', 'Comfortaa', 'Comic Neue', 'Commissioner', 'Cormorant', 'Cormorant Garamond', 'Courier Prime', 'Crimson Pro', 'DM Mono', 'DM Sans', 'DM Serif Display', 'Dancing Script', 'Domine', 'Dosis', 'EB Garamond', 'Eczar', 'Epilogue', 'Exo 2', 'Figtree', 'Fira Code', 'Fira Sans', 'Fjalla One', 'Foldit', 'Fragment Mono', 'Fraunces', 'Fredoka', 'Fredericka the Great', 'Gaegu', 'Gabarito', 'Geist', 'Gloria Hallelujah', 'Great Vibes', 'Heebo', 'IBM Plex Mono', 'IBM Plex Sans', 'IBM Plex Serif', 'Instrument Sans', 'Instrument Serif', 'Inter', 'Inconsolata', 'Indie Flower', 'Inria Serif', 'Irish Grover', 'Josefin Sans', 'Jost', 'Kalam', 'Kanit', 'Karla', 'Kenia', 'Lato', 'League Spartan', 'Lexend', 'Libre Baskerville', 'Lilita One', 'Limelight', 'Lobster', 'Lora', 'Luckiest Guy', 'M PLUS Rounded 1c', 'Manrope', 'Merriweather', 'Merriweather Sans', 'Moirai One', 'Montserrat', 'Mulish', 'MuseoModerno', 'Nanum Myeongjo', 'Noto Sans', 'Noto Serif', 'Nunito', 'Nunito Sans', 'Old Standard TT', 'Onest', 'Open Sans', 'Orbitron', 'Oswald', 'Outfit', 'Overpass', 'Pacifico', 'Permanent Marker', 'Petrona', 'Philosopher', 'Play', 'Playfair Display', 'Plus Jakarta Sans', 'Poppins', 'Press Start 2P', 'Prata', 'Prompt', 'PT Mono', 'PT Sans', 'PT Serif', 'Public Sans', 'Questrial', 'Quicksand', 'Raleway', 'Readex Pro', 'Red Hat Display', 'Red Hat Mono', 'Roboto', 'Roboto Condensed', 'Roboto Flex', 'Roboto Mono', 'Roboto Slab', 'Rubik', 'Rufina', 'Sacramento', 'Saira', 'Satisfy', 'Scope One', 'Sen', 'Shadows Into Light', 'Share Tech Mono', 'Signika', 'Silkscreen', 'Slabo 27px', 'Space Grotesk', 'Space Mono', 'Special Elite', 'Spectral', 'Spline Sans', 'Syne', 'Teko', 'Titan One', 'Trispace', 'Ubuntu', 'Ultra', 'Unbounded', 'Urbanist', 'Varela Round', 'Vollkorn', 'VT323', 'Work Sans', 'Yeseva One', 'Zilla Slab',
]
const fontSlug = (font: string) => font.toLowerCase().replace(/[^a-z0-9]+/g, '-')
const fontStack = (font: string) => `'${font}', Arial, sans-serif`
const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
const publicPortfolioIdFromHash = () => window.location.hash.match(/^#\/p\/([^/]+)$/)?.[1] ?? null
const publicPortfolioUrl = (id: string) => `${window.location.origin}${window.location.pathname}#/p/${id}`
const defaultBackground = (): PageBackground => ({ type: 'color', color: '#fbfaf4', gradientStart: '#e9dcff', gradientEnd: '#fff0cf', gradientAngle: 135, imageUrl: '', imageFit: 'cover' })
const pageBackgroundStyle = (background: PageBackground): CSSProperties => {
  if (background.type === 'gradient') return { backgroundImage: `linear-gradient(${background.gradientAngle}deg, ${background.gradientStart}, ${background.gradientEnd})` }
  if (background.type === 'image' && background.imageUrl) return { backgroundImage: `url("${background.imageUrl}")`, backgroundPosition: 'center', backgroundRepeat: background.imageFit === 'repeat' ? 'repeat' : 'no-repeat', backgroundSize: background.imageFit === 'stretch' ? '100% 100%' : background.imageFit === 'repeat' ? 'auto' : background.imageFit }
  return { backgroundColor: background.color }
}
const loadFont = (font: string) => {
  const id = `folio-font-${fontSlug(font)}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${font.trim().replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`
  document.head.appendChild(link)
}

const starterPages: Page[] = createMinaPages()

const clonePages = () => structuredClone(starterPages) as Page[]
const makePortfolio = (id: string, name: string, description: string, color: string): Portfolio => ({ id, name, description, color, showPortfolioName: true, pages: clonePages(), homePageId: 'home', updated: 'just now' })
const makeBlankPortfolio = (id: string): Portfolio => ({ id, name: 'Untitled portfolio', description: 'A fresh place to show your work', color: '#f4c5a8', showPortfolioName: true, pages: [{ id: 'home', name: 'Home', slug: '', showHeader: true, showInNav: false, transition: 'lift', layout: 'canvas', background: defaultBackground(), blocks: [] }], homePageId: 'home', updated: 'just now' })
const makePreviewWorkspace = (): LocalWorkspace => ({ version: 1, profile: { id: 'preview', name: 'Guest', email: '', createdAt: '' }, portfolios: [makePortfolio('mina', 'Mina’s portfolio', 'A fully editable example portfolio', '#b8a1ff')], assets: [], activePortfolioId: 'mina' })
const makeBlock = (type: BlockType): Block => ({ id: makeId(type), type, content: type === 'audio' || type === 'video' ? '' : type === 'text' ? 'A new thought, waiting for your voice.' : type === 'body' ? 'Use this space for the details: the process, the context, and the small observations that make the work feel like yours.' : type === 'button' ? 'Let’s work together' : type === 'project' ? 'View project →' : type === 'gallery' ? 'A small collection' : type === 'projectGrid' ? 'Selected work' : type === 'links' ? 'Instagram\nBehance\nGitHub' : type === 'quote' ? 'Make the internet feel a little more human.' : type === 'shape' ? 'Decorative circle' : type === 'emitter' ? 'Star dust' : 'Drop an image here', title: type === 'project' ? 'Untitled project' : type === 'quote' ? 'A thought worth keeping' : undefined, subtitle: type === 'text' ? 'New section' : type === 'project' ? 'A short description of your work' : type === 'quote' ? '— Your name' : undefined, animation: 'fade', animationDelay: 0, animationDuration: .55, loopAnimation: 'none', accent: type === 'project' ? '#f5c6a4' : type === 'button' ? '#ff6b4a' : type === 'shape' ? '#b8a1ff' : type === 'emitter' ? '#ffbf4a' : type === 'gallery' ? '#f5c6a4' : undefined, font: type === 'text' ? 'editorial' : type === 'body' ? 'DM Sans' : undefined, buttonVariant: type === 'button' ? 'solid' : undefined, buttonSize: type === 'button' ? 'medium' : undefined, buttonCorner: type === 'button' ? 'soft' : undefined, buttonTextColor: type === 'button' ? '#ffffff' : undefined, showButtonArrow: type === 'button', buttonLinkType: type === 'button' ? 'none' : undefined, shapeType: type === 'shape' ? 'circle' : undefined, shapeScale: type === 'shape' ? 1 : undefined, emitterWidth: type === 'emitter' ? 240 : undefined, emitterHeight: type === 'emitter' ? 180 : undefined, particleStyle: type === 'emitter' ? 'stars' : undefined, particleDensity: type === 'emitter' ? 16 : undefined })
const defaultPosition = (index: number): Position => ({ x: 10 + (index % 3) * 17, y: 13 + index * 15 })

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
  useEffect(() => { if (!selectedId) setInspectorOpen(0) }, [selectedId])
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
    setSaveState('saving')
    let active = true
    const timer = window.setTimeout(() => saveLocalWorkspace(workspace).then(() => { if (active) setSaveState('saved') }).catch(() => { if (active) setSaveState('error') }), 350)
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
  const siteName = useMemo(() => portfolio.name === 'Mina’s portfolio' ? 'mina.studio' : portfolio.name, [portfolio.name])
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
  const id = useRef(makeId('drawer')).current
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
  const id = useRef('asset-shelf').current
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
function ActionIcon({ name }: { name: 'move' | 'edit' | 'duplicate' | 'copy' | 'delete' }) { const paths = { move: <><path d="M6 2v12M3.5 4.5 6 2l2.5 2.5M3.5 11.5 6 14l2.5-2.5" /></>, edit: <><path d="m3 12 1.2-3.4L11.4 1.4a1.4 1.4 0 0 1 2 2L6.2 10.6 3 12Z" /><path d="m9.8 3 2.2 2.2" /></>, duplicate: <><rect x="3" y="3" width="8" height="8" rx="1" /><path d="M6 11v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2" /></>, copy: <><rect x="5" y="2" width="8" height="10" rx="1" /><path d="M3 5v8a1 1 0 0 0 1 1h6" /></>, delete: <><path d="M3 5h10M6 5V3h4v2M5 5l.6 9h4.8L11 5M7 8v3M9 8v3" /></> }[name]; return <svg className="tool-icon" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths}</svg> }
const resizeCorners: ResizeCorner[] = ['nw', 'ne', 'se', 'sw']
const particlePositions = [
  [8, 23, -18, -28, 4], [19, 70, 18, -32, 7], [31, 38, -25, 18, 5], [43, 12, 14, 28, 6], [54, 62, -15, -24, 4], [66, 31, 29, 17, 7], [78, 76, -24, -17, 5], [90, 42, 19, -29, 6], [13, 91, 26, -19, 4], [37, 85, -17, 22, 7], [59, 8, 22, 25, 5], [74, 14, -29, 20, 6], [94, 88, -19, -22, 4], [2, 53, 24, 16, 5], [49, 47, -21, -30, 7], [83, 57, 17, 25, 5], [26, 6, -13, 30, 4], [67, 94, 28, -15, 6], [7, 78, 21, 21, 5], [97, 20, -24, 18, 4], [46, 97, 12, -26, 7], [35, 56, -18, 17, 5], [57, 30, 25, -19, 6], [86, 4, -16, 28, 4],
] as const
function ResizeHandles({ onResizeStart }: { onResizeStart: (event: ReactPointerEvent<HTMLButtonElement>, corner: ResizeCorner) => void }) { return <div className="shape-resize-handles">{resizeCorners.map(corner => <button key={corner} type="button" className={`resize-handle handle-${corner}`} aria-label={`Resize from ${corner}`} onPointerDown={event => onResizeStart(event, corner)} />)}</div> }
function ParticleEmitter({ block }: { block: Block }) { const density = Math.min(24, Math.max(6, block.particleDensity ?? 16)); const style = block.particleStyle ?? 'stars'; const accent = block.accent ?? '#ffbf4a'; return <div className={`particle-emitter particle-${style}`} style={{ '--emitter-accent': accent } as CSSProperties} aria-label={block.content} role="img">{particlePositions.slice(0, density).map(([x, y, driftX, driftY, size], index) => <i key={index} style={{ '--particle-x': `${x}%`, '--particle-y': `${y}%`, '--particle-drift-x': `${driftX}px`, '--particle-drift-y': `${driftY}px`, '--particle-size': `${size}px`, '--particle-delay': `${-(index % 6) * .36}s`, '--particle-accent': accent } as CSSProperties} />)}</div> }
function BlockView({ block, canvas, preview, range = 'wide', active, onClick, onChange, onEdit, onDuplicate, onCopy, onDelete, onNavigate, onMoveStart, onResizeStart }: { block: Block; canvas: boolean; preview: boolean; range?: ResponsiveRange; active: boolean; onClick: () => void; onChange: (patch: Partial<Block>) => void; onEdit: () => void; onDuplicate: () => void; onCopy: () => void; onDelete: () => void; onNavigate: (pageId: string) => void; onMoveStart: (event: ReactPointerEvent<HTMLElement>) => void; onResizeStart: (event: ReactPointerEvent<HTMLButtonElement>, corner: ResizeCorner) => void }) {
  const overrideKey = rangeSpecs[range].overrideKey
  const responsive = overrideKey ? block.responsive?.[overrideKey] : undefined
  const shapeScale = block.shapeScale ?? 1
  const canvasSize = (baseSize: number, override?: number) => override !== undefined ? `${override}px` : canvas ? `${baseSize / CANVAS_REFERENCE_WIDTH * 100}cqw` : `${baseSize}px`
  const shapeWidth = responsive?.width ?? (block.shapeWidth ?? (block.shapeType === 'pill' ? 220 : 145) * shapeScale)
  const shapeHeight = responsive?.height ?? (block.shapeHeight ?? (block.shapeType === 'pill' ? 104 : 145) * shapeScale)
  const imageWidth = responsive?.width ?? (block.imageWidth ?? 420)
  const imageHeight = responsive?.height ?? (block.imageHeight ?? 280)
  const emitterWidth = responsive?.width ?? (block.emitterWidth ?? 240)
  const emitterHeight = responsive?.height ?? (block.emitterHeight ?? 180)
  const activePosition = responsive?.position ?? block.position
  const fillsCanvas = block.fillCanvas && !responsive?.width && !responsive?.height
  const anchorX = responsive?.anchorX ?? block.anchorX
  const anchorY = responsive?.anchorY ?? block.anchorY
  const centerX = anchorX === 'center' || (!anchorX && (responsive?.centerX ?? block.centerX))
  const centerY = anchorY === 'center' || (!anchorY && (responsive?.centerY ?? block.centerY))
  const canvasContentWidths: Partial<Record<BlockType, number>> = { text: 720, body: 610, project: 570, gallery: 590, projectGrid: 700, links: 420, quote: 720 }
  const canvasContentWidth = canvasContentWidths[block.type]
  const offsetX = activePosition?.x ?? 10
  const offsetY = activePosition?.y ?? 15
  const left = !anchorX ? `${offsetX}%` : anchorX === 'left' ? `${offsetX}%` : anchorX === 'center' ? `calc(50% + ${offsetX}%)` : `calc(100% - ${offsetX}%)`
  const top = !anchorY ? `${offsetY}%` : anchorY === 'top' ? `${offsetY}%` : anchorY === 'center' ? `calc(50% + ${offsetY}%)` : `calc(100% - ${offsetY}%)`
  const translateX = anchorX === 'right' ? '-100%' : centerX ? '-50%' : '0'
  const translateY = anchorY === 'bottom' ? '-100%' : centerY ? '-50%' : '0'
  const position = { ...(canvas ? { left: fillsCanvas ? '0' : left, top: fillsCanvas ? '0' : top, '--folio-x': left, '--folio-y': top, translate: fillsCanvas ? '0 0' : `${translateX} ${translateY}` } : {}), ...(canvas && !fillsCanvas && canvasContentWidth ? { width: canvasSize(canvasContentWidth), maxWidth: 'none', minWidth: 0 } : {}), ...(block.type === 'shape' ? { '--shape-width': canvasSize(shapeWidth, responsive?.width), '--shape-height': canvasSize(shapeHeight, responsive?.height) } : {}), ...(block.type === 'image' ? { '--image-width': canvasSize(imageWidth, responsive?.width), '--image-height': canvasSize(imageHeight, responsive?.height) } : {}), ...(block.type === 'emitter' ? { '--emitter-width': canvasSize(emitterWidth, responsive?.width), '--emitter-height': canvasSize(emitterHeight, responsive?.height) } : {}) } as CSSProperties
  const selectedFont = block.font ?? (block.type === 'text' ? 'editorial' : 'DM Sans')
  const family = featuredFonts.find(([id]) => id === selectedFont)?.[1] ?? selectedFont
  const accent = block.accent ?? '#b8a1ff'
  const links = block.content.split('\n').filter(Boolean)
  const resizable = canvas && ['shape', 'image', 'emitter'].includes(block.type)
  const buttonStyle = { '--button-accent': accent, '--button-text': block.buttonTextColor ?? '#ffffff' } as CSSProperties
  const imageFrameStyle = { '--image-border-width': `${!block.imageBorderStyle || block.imageBorderStyle === 'none' ? 0 : block.imageBorderWidth ?? 2}px`, '--image-border-color': block.imageBorderColor ?? '#24261f', '--image-border-gradient': `linear-gradient(${block.imageBorderAngle ?? 135}deg, ${block.imageBorderStart ?? '#ff6b4a'}, ${block.imageBorderEnd ?? '#b8a1ff'})`, '--image-radius': `${block.imageRadius ?? 0}px`, '--image-opacity': String((block.imageOpacity ?? 100) / 100) } as CSSProperties
  const supportsTextStyle = block.type === 'text' || block.type === 'body'
  const baseTextSize = block.textSize ?? (block.type === 'text' ? 72 : 18)
  const activeTextSize = responsive?.textSize !== undefined ? `${responsive.textSize}px` : canvas ? `${baseTextSize / CANVAS_REFERENCE_WIDTH * 100}cqw` : undefined
  const textShadow = block.textShadowEnabled ? `${block.textShadowX ?? 0}px ${block.textShadowY ?? 4}px ${block.textShadowBlur ?? 12}px ${colorWithOpacity(block.textShadowColor ?? '#000000', block.textShadowOpacity ?? 32)}` : undefined
  const textStyle = supportsTextStyle ? { color: block.textColor, textShadow, fontSize: activeTextSize, '--folio-text-size': activeTextSize ?? (block.textSize ? `${block.textSize}px` : undefined), fontWeight: block.textWeight, lineHeight: block.textLineHeight, letterSpacing: block.textLetterSpacing !== undefined ? `${block.textLetterSpacing}em` : undefined, fontStyle: block.textItalic ? 'italic' : undefined, textTransform: block.textTransform } as CSSProperties : undefined
  const followButton = (event: ReactMouseEvent<HTMLButtonElement>) => { if (!preview) return; event.stopPropagation(); if (block.buttonLinkType === 'page' && block.buttonPageId) onNavigate(block.buttonPageId); if (block.buttonLinkType === 'url' && block.buttonUrl) window.open(block.buttonUrl, '_blank', 'noopener,noreferrer') }
  return <section data-block-id={block.id} onClick={onClick} onPointerDown={event => onMoveStart(event)} style={{ ...position, textAlign: supportsTextStyle ? block.textAlign ?? 'left' : undefined }} className={`site-block ${canvas ? 'canvas-block' : ''} ${block.type} ${centerX ? 'center-x' : ''} ${centerY ? 'center-y' : ''} ${fillsCanvas && canvas ? 'fills-canvas' : ''} ${responsive?.hidden ? 'responsive-hidden' : ''} ${responsive?.width !== undefined || responsive?.height !== undefined ? 'responsive-size' : ''} font-${selectedFont} motion-${block.animation} ${active ? 'active' : ''}`}><div className="block-tools" onClick={event => event.stopPropagation()}><button onClick={onEdit}><ActionIcon name="edit" />Edit</button><button onClick={onDuplicate}><ActionIcon name="duplicate" />Duplicate</button><button onClick={onCopy}><ActionIcon name="copy" />Copy</button><button className="tool-delete" onClick={onDelete}><ActionIcon name="delete" />Delete</button></div>{active && <span className="block-tag">{blockInfo[block.type].label}</span>}{block.type === 'text' && <><p className="kicker" contentEditable={!preview} suppressContentEditableWarning data-block-editable={block.id} onBlur={event => onChange({ subtitle: event.currentTarget.textContent ?? '' })}>{block.subtitle}</p><h1 style={{ fontFamily: fontStack(family), ...textStyle }} contentEditable={!preview} suppressContentEditableWarning data-block-editable={block.id} onBlur={event => onChange({ content: event.currentTarget.textContent ?? '' })}>{block.content}</h1></>}{block.type === 'body' && <p className="body-copy" style={{ fontFamily: fontStack(family), ...textStyle }} contentEditable={!preview} suppressContentEditableWarning data-block-editable={block.id} onBlur={event => onChange({ content: event.currentTarget.textContent ?? '' })}>{block.content}</p>}{block.type === 'image' && <div style={imageFrameStyle} className={`image-block image-border-${block.imageBorderStyle ?? 'none'} image-fade-${block.imageFade ?? 'none'} ${block.imageUrl ? 'has-image' : ''}`}>{block.imageUrl ? <img src={block.imageUrl} alt={block.imageAlt ?? block.content} /> : <><span>✳</span><p>{block.content}</p></>}</div>}{block.type === 'button' && <button onClick={followButton} className={`portfolio-button button-${block.buttonVariant ?? 'solid'} button-${block.buttonSize ?? 'medium'} button-${block.buttonCorner ?? 'soft'}`} style={buttonStyle}>{block.content}{block.showButtonArrow !== false && <span>↗</span>}</button>}{block.type === 'project' && <div className="project-block"><div className="project-art" style={{ background: `linear-gradient(135deg, ${block.accent}, #ffe5bc)` }}>☼</div><div className="project-copy"><p>Featured project</p><h2>{block.title}</h2><span>{block.subtitle}</span><b>{block.content}</b></div></div>}{block.type === 'gallery' && <div className="gallery-block"><div style={{ background: `linear-gradient(145deg, ${accent}, #fff0cf)` }} /><div style={{ background: `linear-gradient(145deg, #d8e1be, ${accent})` }} /><div style={{ background: `linear-gradient(145deg, #cadce2, #fff0cf)` }} /><p>{block.content}</p></div>}{block.type === 'projectGrid' && <div className="project-grid-block">{['Orbit', 'Small worlds', 'Mallow'].map((name, index) => <div key={name}><span style={{ background: index === 0 ? accent : index === 1 ? '#c9dcb8' : '#f1c4b5' }}>✦</span><b>{name}</b><small>View project ↗</small></div>)}</div>}{block.type === 'links' && <div className="link-list">{links.map(link => <span key={link}>{link}<i>↗</i></span>)}</div>}{block.type === 'quote' && <blockquote className="quote-block"><p contentEditable={!preview} suppressContentEditableWarning data-block-editable={block.id} onBlur={event => onChange({ content: event.currentTarget.textContent ?? '' })}>“{block.content}”</p><cite>{block.subtitle}</cite></blockquote>}{block.type === 'shape' && <div className={`shape-block shape-${block.shapeType ?? 'circle'}`} style={{ background: accent }} aria-label={block.content} role="img" />}{(block.type === 'audio' || block.type === 'video') && <MediaEmbed kind={block.type} url={block.content} preview={preview} />}{block.type === 'emitter' && <ParticleEmitter block={block} />}{active && resizable && <ResizeHandles onResizeStart={onResizeStart} />}</section>
}
function PageSettings({ page, isHome, onChange, onSetHome, onSetLayout }: { page: Page; isHome: boolean; onChange: (patch: Partial<Page>) => void; onSetHome: () => void; onSetLayout: (layout: LayoutMode) => void }) {
  const background = page.background
  const canvasHeight = page.canvasHeight ?? 900
  const updateBackground = (patch: Partial<PageBackground>) => onChange({ background: { ...background, ...patch } })
  return <div className="page-settings"><p className="drawer-kicker">Page settings</p><Field label="Page name" value={page.name} onChange={name => onChange({ name })} /><Field label="URL path" value={page.slug} onChange={slug => onChange({ slug: slug.replace(/^\/+/, '').replace(/\s+/g, '-').toLowerCase() })} /><p className="path-preview">yourname.folio.page{page.slug ? `/${page.slug}` : ''}</p><label className="field"><span>Page format</span><select value={page.layout} onChange={event => onSetLayout(event.target.value as LayoutMode)}><option value="canvas">Canvas — free placement</option><option value="scroll">Scroll — structured flow</option></select></label>{page.layout === 'canvas' && <label className="field canvas-height-control"><span>Canvas height · {canvasHeight}px</span><input type="range" min="700" max="2400" step="100" value={canvasHeight} onChange={event => onChange({ canvasHeight: Number(event.target.value) })} /><small>Extend the page for more room. Limited to 2,400px to keep portfolios fast.</small></label>}<label className="field"><span>Page transition</span><select value={page.transition} onChange={event => onChange({ transition: event.target.value as PageTransition })}><option value="lift">Lift in</option><option value="slide">Slide across</option><option value="fade">Soft fade</option></select></label><div className="background-settings"><span>Page background</span><label className="field"><span>Background type</span><select value={background.type} onChange={event => updateBackground({ type: event.target.value as BackgroundType })}><option value="color">Solid color</option><option value="gradient">Color gradient</option><option value="image">Image</option></select></label>{background.type === 'color' && <label className="field"><span>Page color</span><input type="color" value={background.color} onChange={event => updateBackground({ color: event.target.value })} /></label>}{background.type === 'gradient' && <><div className="color-pair"><label className="field"><span>Start</span><input type="color" value={background.gradientStart} onChange={event => updateBackground({ gradientStart: event.target.value })} /></label><label className="field"><span>End</span><input type="color" value={background.gradientEnd} onChange={event => updateBackground({ gradientEnd: event.target.value })} /></label></div><label className="field"><span>Angle · {background.gradientAngle}°</span><input type="range" min="0" max="360" value={background.gradientAngle} onChange={event => updateBackground({ gradientAngle: Number(event.target.value) })} /></label></>}{background.type === 'image' && <><Field label="Image URL" value={background.imageUrl} onChange={imageUrl => updateBackground({ imageUrl })} /><label className="field"><span>Image scaling</span><select value={background.imageFit} onChange={event => updateBackground({ imageFit: event.target.value as ImageFit })}><option value="cover">Crop to fill</option><option value="contain">Fit whole image</option><option value="stretch">Stretch to fit</option><option value="repeat">Repeat as pattern</option></select></label><p className="background-note">Use a direct image link for now. Uploading images will come with the real publishing system.</p></>}</div><label className="setting-toggle"><input type="checkbox" checked={isHome} onChange={onSetHome} /><span><b>Home page</b><small>Visitors land here first</small></span></label><label className="setting-toggle"><input type="checkbox" checked={page.showHeader} onChange={event => onChange({ showHeader: event.target.checked })} /><span><b>Show website header</b><small>Show this page’s navigation bar and portfolio name</small></span></label><label className="setting-toggle"><input type="checkbox" checked={page.showInNav} onChange={event => onChange({ showInNav: event.target.checked })} /><span><b>Show in navigation</b><small>Add this page to your menu</small></span></label></div>
}
function InspectorSection({ title, initiallyOpen = false, children }: { title: string; initiallyOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(initiallyOpen)
  return <section className={`inspector-section ${open ? 'open' : ''}`}><button type="button" className="inspector-section-trigger" aria-expanded={open} onClick={() => setOpen(value => !value)}><span>{title}</span><i>{open ? '−' : '+'}</i></button>{open && <div className="inspector-section-content">{children}</div>}</section>
}
function Inspector({ block, pages, assets, onChange, onDelete, onLayerMove, onAnchor, responsiveRange, onResponsiveRange, onResponsiveChange, onClearResponsive }: { block: Block; pages: Page[]; assets: Asset[]; onChange: (patch: Partial<Block>) => void; onDelete: () => void; onLayerMove: (direction: 'forward' | 'backward') => void; onAnchor: (id: string, anchorX: CanvasAnchorX, anchorY: CanvasAnchorY) => void; responsiveRange: ResponsiveRange; onResponsiveRange: (range: ResponsiveRange) => void; onResponsiveChange: (patch: Partial<ResponsiveOverride>) => void; onClearResponsive: () => void }) {
  const copyLabel = block.type === 'text' || block.type === 'body' ? 'Copy' : block.type === 'project' ? 'Link label' : block.type === 'links' ? 'Links · one per line' : block.type === 'quote' ? 'Quote' : block.type === 'gallery' ? 'Gallery label' : block.type === 'shape' ? 'Description' : block.type === 'emitter' ? 'Emitter label' : 'Label'
  const canvas = pages.find(page => page.blocks.some(item => item.id === block.id))?.layout === 'canvas'
  const resizable = block.type === 'shape' || block.type === 'image' || block.type === 'emitter'
  const isText = block.type === 'text' || block.type === 'body'
  const hasDesign = isText || block.type === 'button' || block.type === 'project' || block.type === 'shape' || block.type === 'gallery' || block.type === 'emitter'
  const overrideKey = rangeSpecs[responsiveRange].overrideKey
  const responsive = overrideKey ? block.responsive?.[overrideKey] : undefined
  const setTextSize = (textSize: number) => {
    if (overrideKey) onResponsiveChange({ textSize })
    else onChange({ textSize })
  }
  return <div className="inspector"><div className="inspector-heading"><span className="type-icon">{blockInfo[block.type].icon}</span><div><strong>{blockInfo[block.type].label}</strong><small>Selected block</small></div></div><InspectorSection title="Content" initiallyOpen>{block.type === 'project' && <Field label="Project name" value={block.title ?? ''} onChange={title => onChange({ title })} />}{(block.type === 'text' || block.type === 'project' || block.type === 'quote') && <Field label={block.type === 'text' ? 'Kicker' : block.type === 'quote' ? 'Attribution' : 'Description'} value={block.subtitle ?? ''} onChange={subtitle => onChange({ subtitle })} />}{block.type === 'audio' || block.type === 'video' ? <EmbedSettings kind={block.type} url={block.content} onChange={content => onChange({ content })} /> : block.type === 'image' ? <ImageSettings block={block} assets={assets} onChange={onChange} /> : <label className="field"><span>{copyLabel}</span><textarea value={block.content} rows={isText || block.type === 'quote' ? 4 : 2} onChange={event => onChange({ content: event.target.value })} /></label>}</InspectorSection>{hasDesign && <InspectorSection title={isText ? 'Typography' : 'Design'} initiallyOpen={isText || block.type === 'button'}>{isText && <><FontPicker value={block.font ?? (block.type === 'text' ? 'editorial' : 'DM Sans')} onChange={font => onChange({ font })} /><TextSettings block={block} onChange={onChange} textSize={responsive?.textSize} onTextSizeChange={setTextSize} /></>}{block.type === 'button' && <ButtonSettings block={block} pages={pages} onChange={onChange} />}{(block.type === 'project' || block.type === 'shape' || block.type === 'gallery' || block.type === 'emitter') && <label className="field"><span>Accent</span><input type="color" value={block.accent ?? '#ff6b4a'} onChange={event => onChange({ accent: event.target.value })} /></label>}{block.type === 'shape' && <ShapeSettings block={block} onChange={onChange} />}{block.type === 'emitter' && <ParticleSettings block={block} onChange={onChange} />}</InspectorSection>}{canvas && <InspectorSection title="Position & size">{resizable && <SizeSettings block={block} range={responsiveRange} onChange={onChange} onResponsiveChange={onResponsiveChange} />}<AnchorSettings block={block} range={responsiveRange} onAnchor={onAnchor} /><div className="canvas-positioning layer-positioning"><p>Layer order</p><div><button type="button" onClick={() => onLayerMove('backward')}>↓ Send backward</button><button type="button" onClick={() => onLayerMove('forward')}>↑ Bring forward</button></div></div></InspectorSection>}<InspectorSection title="Responsive"><ResponsiveSettings block={block} canvas={canvas} range={responsiveRange} onRangeChange={onResponsiveRange} onChange={onResponsiveChange} onClear={onClearResponsive} /></InspectorSection><InspectorSection title="Motion"><AnimationSettings block={block} onChange={onChange} /></InspectorSection><InspectorSection title="Danger zone"><div className="inspector-actions"><button className="delete" onClick={onDelete}>Delete element</button></div></InspectorSection></div>
}
function AnchorSettings({ block, range, onAnchor }: { block: Block; range: ResponsiveRange; onAnchor: (id: string, anchorX: CanvasAnchorX, anchorY: CanvasAnchorY) => void }) {
  const overrideKey = rangeSpecs[range].overrideKey
  const override = overrideKey ? block.responsive?.[overrideKey] : undefined
  const currentX = override?.anchorX ?? block.anchorX
  const currentY = override?.anchorY ?? block.anchorY
  const anchors: [CanvasAnchorY, CanvasAnchorX, string][] = [['top', 'left', 'Top left'], ['top', 'center', 'Top center'], ['top', 'right', 'Top right'], ['center', 'left', 'Middle left'], ['center', 'center', 'Center'], ['center', 'right', 'Middle right'], ['bottom', 'left', 'Bottom left'], ['bottom', 'center', 'Bottom center'], ['bottom', 'right', 'Bottom right']]
  return <div className="canvas-positioning anchor-positioning"><p>Anchor this element</p><div className="anchor-grid" role="group" aria-label="Canvas anchor">{anchors.map(([y, x, label]) => <button type="button" key={label} title={label} aria-label={label} className={currentX === x && currentY === y ? 'active' : ''} onClick={() => onAnchor(block.id, x, y)}><i /></button>)}</div><small>Anchors keep the element’s meaning at each screen size. Drag afterward to set its offset.</small></div>
}
function ResponsiveSettings({ block, canvas, range, onRangeChange, onChange, onClear }: { block: Block; canvas: boolean; range: ResponsiveRange; onRangeChange: (range: ResponsiveRange) => void; onChange: (patch: Partial<ResponsiveOverride>) => void; onClear: () => void }) {
  const overrideKey = rangeSpecs[range].overrideKey
  const isWide = !overrideKey
  const override = overrideKey ? block.responsive?.[overrideKey] : undefined
  const basePosition = block.position ?? { x: 10, y: 15 }
  const position = override?.position ?? basePosition
  const baseWidth = block.type === 'shape' ? block.shapeWidth ?? (block.shapeType === 'pill' ? 220 : 145) * (block.shapeScale ?? 1) : block.type === 'image' ? block.imageWidth ?? 420 : block.emitterWidth ?? 240
  const baseHeight = block.type === 'shape' ? block.shapeHeight ?? (block.shapeType === 'pill' ? 104 : 145) * (block.shapeScale ?? 1) : block.type === 'image' ? block.imageHeight ?? 280 : block.emitterHeight ?? 180
  const resizable = ['shape', 'image', 'emitter'].includes(block.type)
  const setPosition = (axis: 'x' | 'y', value: number) => onChange({ position: { ...position, [axis]: Math.max(-15, Math.min(115, value)) } })
  const setSize = (axis: 'width' | 'height', value: number) => onChange({ [axis]: Math.max(42, Math.min(2400, value)) })
  return <div className="responsive-settings"><div className="responsive-heading"><div><p>Responsive ranges</p><small>Wide is your shared base. Medium and Compact inherit it until you choose an override.</small></div>{!isWide && override && <button type="button" onClick={onClear}>Reset {rangeSpecs[range].label}</button>}</div><div className="responsive-device-tabs" role="group" aria-label="Responsive editing range">{(Object.keys(rangeSpecs) as ResponsiveRange[]).map(id => <button type="button" className={range === id ? 'active' : ''} key={id} onClick={() => onRangeChange(id)}>{rangeSpecs[id].label}</button>)}</div>{isWide ? <p className="responsive-base-note">Build the shared version here. Only use Medium or Compact for a deliberate exception—most changes should stay shared.</p> : <><label className="setting-toggle compact-toggle"><input type="checkbox" checked={override?.hidden ?? false} onChange={event => onChange({ hidden: event.target.checked })} /><span><b>Hide on {rangeSpecs[range].label}</b><small>Keep it in the shared composition, without showing it in this range.</small></span></label>{canvas && <div className="responsive-fields"><p>Offset · % from its anchor</p><div><label className="field"><span>X</span><input type="number" min="-15" max="115" value={Math.round(position.x)} onChange={event => setPosition('x', Number(event.target.value))} /></label><label className="field"><span>Y</span><input type="number" min="-15" max="115" value={Math.round(position.y)} onChange={event => setPosition('y', Number(event.target.value))} /></label></div></div>}{resizable && <div className="responsive-fields"><p>Size · pixels</p><div><label className="field"><span>Width</span><input type="number" min="42" max="2400" value={Math.round(override?.width ?? baseWidth)} onChange={event => setSize('width', Number(event.target.value))} /></label><label className="field"><span>Height</span><input type="number" min="42" max="2400" value={Math.round(override?.height ?? baseHeight)} onChange={event => setSize('height', Number(event.target.value))} /></label></div></div>}</>}</div>
}
function TextSettings({ block, onChange, textSize, onTextSizeChange }: { block: Block; onChange: (patch: Partial<Block>) => void; textSize?: number; onTextSizeChange?: (value: number) => void }) {
  const isHeading = block.type === 'text'
  const size = textSize ?? block.textSize ?? (isHeading ? 72 : 18)
  const weight = block.textWeight ?? (isHeading ? 600 : 400)
  const lineHeight = block.textLineHeight ?? (isHeading ? .98 : 1.65)
  const letterSpacing = block.textLetterSpacing ?? (isHeading ? -.055 : 0)
  const align = block.textAlign ?? 'left'
  const setSize = (value: number) => {
    const next = Math.max(isHeading ? 28 : 12, Math.min(isHeading ? 160 : 56, value))
    if (onTextSizeChange) onTextSizeChange(next)
    else onChange({ textSize: next })
  }
  return <div className="text-settings"><p>Type style</p><div className="text-align-control" role="group" aria-label="Text alignment">{([['left', '☰', 'Align left'], ['center', '≡', 'Align center'], ['right', '☷', 'Align right']] as const).map(([value, icon, label]) => <button type="button" key={value} className={align === value ? 'chosen' : ''} onClick={() => onChange({ textAlign: value })} aria-label={label} title={label}>{icon}</button>)}</div><label className="field"><span>Font size · {size}px</span><input type="range" min={isHeading ? 28 : 12} max={isHeading ? 160 : 56} value={size} onChange={event => setSize(Number(event.target.value))} /></label><div className="text-setting-grid"><label className="field"><span>Weight</span><select value={weight} onChange={event => onChange({ textWeight: Number(event.target.value) })}><option value="300">Light</option><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option><option value="800">Extra bold</option></select></label><label className="field"><span>Case</span><select value={block.textTransform ?? 'none'} onChange={event => onChange({ textTransform: event.target.value as Block['textTransform'] })}><option value="none">Original case</option><option value="uppercase">UPPERCASE</option><option value="capitalize">Title Case</option><option value="lowercase">lowercase</option></select></label></div><div className="text-setting-grid"><label className="field"><span>Line height · {lineHeight.toFixed(2)}</span><input type="range" min={isHeading ? .8 : 1.1} max={isHeading ? 1.5 : 2.2} step=".05" value={lineHeight} onChange={event => onChange({ textLineHeight: Number(event.target.value) })} /></label><label className="field"><span>Letter spacing · {letterSpacing.toFixed(3)}em</span><input type="range" min="-.12" max=".2" step=".005" value={letterSpacing} onChange={event => onChange({ textLetterSpacing: Number(event.target.value) })} /></label></div><div className="text-color-row"><label className="field"><span>Text color</span><input type="color" value={block.textColor ?? (isHeading ? '#22251f' : '#5f5d56')} onChange={event => onChange({ textColor: event.target.value })} /></label><button type="button" className={`italic-toggle ${block.textItalic ? 'chosen' : ''}`} onClick={() => onChange({ textItalic: !block.textItalic })}><i>I</i> Italic</button></div><label className="setting-toggle compact-toggle text-shadow-toggle"><input type="checkbox" checked={block.textShadowEnabled ?? false} onChange={event => onChange({ textShadowEnabled: event.target.checked })} /><span><b>Text shadow</b><small>Add depth without leaving the editor</small></span></label>{block.textShadowEnabled && <div className="text-shadow-settings"><div className="text-color-row"><label className="field"><span>Shadow color</span><input type="color" value={block.textShadowColor ?? '#000000'} onChange={event => onChange({ textShadowColor: event.target.value })} /></label><label className="field"><span>Opacity · {block.textShadowOpacity ?? 32}%</span><input type="range" min="0" max="100" value={block.textShadowOpacity ?? 32} onChange={event => onChange({ textShadowOpacity: Number(event.target.value) })} /></label></div><div className="text-setting-grid"><label className="field"><span>Horizontal · {block.textShadowX ?? 0}px</span><input type="range" min="-40" max="40" value={block.textShadowX ?? 0} onChange={event => onChange({ textShadowX: Number(event.target.value) })} /></label><label className="field"><span>Vertical · {block.textShadowY ?? 4}px</span><input type="range" min="-40" max="40" value={block.textShadowY ?? 4} onChange={event => onChange({ textShadowY: Number(event.target.value) })} /></label></div><label className="field"><span>Blur radius · {block.textShadowBlur ?? 12}px</span><input type="range" min="0" max="80" value={block.textShadowBlur ?? 12} onChange={event => onChange({ textShadowBlur: Number(event.target.value) })} /></label></div>}</div>
}
function ImageSettings({ block, assets, onChange }: { block: Block; assets: Asset[]; onChange: (patch: Partial<Block>) => void }) {
  const images = assets.filter(asset => asset.kind === 'image')
  const borderStyle = block.imageBorderStyle ?? 'none'
  const chooseImage = (asset: Asset) => onChange({ imageUrl: asset.dataUrl, content: asset.name, imageAlt: block.imageAlt || asset.name.replace(/\.[^.]+$/, '') })
  return <div className="image-settings"><p>Image source</p>{images.length === 0 ? <p className="image-shelf-note">Your Asset shelf is empty. Upload an image there, then come back here to choose it.</p> : <div className="inspector-image-library">{images.map(asset => <button type="button" className={block.imageUrl === asset.dataUrl ? 'chosen' : ''} key={asset.id} onClick={() => chooseImage(asset)}><span style={{ backgroundImage: `url("${asset.dataUrl}")` }} /><small>{asset.name.replace(/\.[^.]+$/, '')}</small></button>)}</div>}{block.imageUrl && <button type="button" className="remove-image" onClick={() => onChange({ imageUrl: undefined })}>Remove image</button>}<Field label="Alt text" value={block.imageAlt ?? ''} onChange={imageAlt => onChange({ imageAlt })} /><Field label="Image label" value={block.content} onChange={content => onChange({ content })} /><div className="image-treatment"><p>Image treatment</p><div className="text-setting-grid"><label className="field"><span>Border</span><select value={borderStyle} onChange={event => onChange({ imageBorderStyle: event.target.value as Block['imageBorderStyle'] })}><option value="none">None</option><option value="solid">Solid color</option><option value="gradient">Color gradient</option></select></label><label className="field"><span>Corner radius · {block.imageRadius ?? 0}px</span><input type="range" min="0" max="48" value={block.imageRadius ?? 0} onChange={event => onChange({ imageRadius: Number(event.target.value) })} /></label></div>{borderStyle !== 'none' && <><label className="field"><span>Border width · {block.imageBorderWidth ?? 2}px</span><input type="range" min="1" max="16" value={block.imageBorderWidth ?? 2} onChange={event => onChange({ imageBorderWidth: Number(event.target.value) })} /></label>{borderStyle === 'solid' ? <label className="field"><span>Border color</span><input type="color" value={block.imageBorderColor ?? '#24261f'} onChange={event => onChange({ imageBorderColor: event.target.value })} /></label> : <><div className="color-pair"><label className="field"><span>Gradient start</span><input type="color" value={block.imageBorderStart ?? '#ff6b4a'} onChange={event => onChange({ imageBorderStart: event.target.value })} /></label><label className="field"><span>Gradient end</span><input type="color" value={block.imageBorderEnd ?? '#b8a1ff'} onChange={event => onChange({ imageBorderEnd: event.target.value })} /></label></div><label className="field"><span>Gradient angle · {block.imageBorderAngle ?? 135}°</span><input type="range" min="0" max="360" value={block.imageBorderAngle ?? 135} onChange={event => onChange({ imageBorderAngle: Number(event.target.value) })} /></label></>}</>}<label className="field"><span>Opacity · {block.imageOpacity ?? 100}%</span><input type="range" min="10" max="100" value={block.imageOpacity ?? 100} onChange={event => onChange({ imageOpacity: Number(event.target.value) })} /></label><label className="field"><span>Transparency fade</span><select value={block.imageFade ?? 'none'} onChange={event => onChange({ imageFade: event.target.value as Block['imageFade'] })}><option value="none">None</option><option value="top">Fade at top</option><option value="bottom">Fade at bottom</option><option value="left">Fade on left</option><option value="right">Fade on right</option></select></label><small className="image-treatment-note">Fade makes the image itself dissolve into the page—handy for collage-like canvas layouts.</small></div><p className="image-note">Upload new files from the Asset shelf. Your shelf stays in this browser session for now.</p></div>
}
function SizeSettings({ block, range, onChange, onResponsiveChange }: { block: Block; range: ResponsiveRange; onChange: (patch: Partial<Block>) => void; onResponsiveChange: (patch: Partial<ResponsiveOverride>) => void }) {
  const overrideKey = rangeSpecs[range].overrideKey
  const override = overrideKey ? block.responsive?.[overrideKey] : undefined
  const shapeWidth = block.shapeWidth ?? (block.shapeType === 'pill' ? 220 : 145) * (block.shapeScale ?? 1)
  const shapeHeight = block.shapeHeight ?? (block.shapeType === 'pill' ? 104 : 145) * (block.shapeScale ?? 1)
  const baseWidth = block.type === 'shape' ? shapeWidth : block.type === 'image' ? block.imageWidth ?? 420 : block.emitterWidth ?? 240
  const baseHeight = block.type === 'shape' ? shapeHeight : block.type === 'image' ? block.imageHeight ?? 280 : block.emitterHeight ?? 180
  const width = override?.width ?? baseWidth
  const height = override?.height ?? baseHeight
  const updateSize = (nextWidth: number, nextHeight: number) => {
    const safeWidth = Math.max(42, Math.min(2400, Math.round(nextWidth)))
    const safeHeight = Math.max(42, Math.min(2400, Math.round(nextHeight)))
    if (overrideKey) { onResponsiveChange({ width: safeWidth, height: safeHeight }); return }
    if (block.type === 'shape') onChange({ shapeWidth: safeWidth, shapeHeight: safeHeight, shapeScale: undefined, fillCanvas: false })
    if (block.type === 'image') onChange({ imageWidth: safeWidth, imageHeight: safeHeight, fillCanvas: false })
    if (block.type === 'emitter') onChange({ emitterWidth: safeWidth, emitterHeight: safeHeight, fillCanvas: false })
  }
  return <div className="size-settings"><div><p>Size</p><small>Fine-tune in pixels, or make it cover the full canvas.</small></div><div className="size-fields"><label className="field"><span>Width</span><input type="number" min="42" max="2400" value={Math.round(width)} onChange={event => updateSize(Number(event.target.value) || 42, height)} /></label><span>×</span><label className="field"><span>Height</span><input type="number" min="42" max="2400" value={Math.round(height)} onChange={event => updateSize(width, Number(event.target.value) || 42)} /></label></div><button type="button" className={`fill-canvas ${block.fillCanvas ? 'active' : ''}`} onClick={() => onChange({ fillCanvas: !block.fillCanvas, position: block.fillCanvas ? block.position : { x: 0, y: 0 }, centerX: block.fillCanvas ? block.centerX : false, centerY: block.fillCanvas ? block.centerY : false })}>{block.fillCanvas ? '✓ Filling entire canvas' : '↗ Fill entire canvas'}</button></div>
}
function ShapeSettings({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void }) { const shape = block.shapeType ?? 'circle'; return <div className="shape-settings"><p>Shape design</p><div className="shape-choice-grid">{([['circle', 'Circle'], ['square', 'Square'], ['rounded', 'Rounded square'], ['triangle', 'Triangle'], ['diamond', 'Diamond'], ['star', 'Star'], ['pill', 'Pill']] as const).map(([id, label]) => <button type="button" key={id} className={`shape-choice ${shape === id ? 'chosen' : ''}`} onClick={() => onChange({ shapeType: id })}><i className={`shape-swatch shape-${id}`} /><span>{label}</span></button>)}</div><p className="shape-resize-note">Select the shape, then drag any corner handle to resize it freely.</p></div> }
function ParticleSettings({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void }) { const style = block.particleStyle ?? 'stars'; const density = block.particleDensity ?? 16; return <div className="particle-settings"><p>Particle design</p><div className="particle-style-grid">{([['dots', 'Dots'], ['stars', 'Stars'], ['confetti', 'Confetti']] as const).map(([id, label]) => <button type="button" key={id} className={style === id ? 'chosen' : ''} onClick={() => onChange({ particleStyle: id })}><i className={`particle-preview particle-${id}`} />{label}</button>)}</div><label className="field"><span>Density · {density} particles</span><input type="range" min="6" max="24" step="1" value={density} onChange={event => onChange({ particleDensity: Number(event.target.value) })} /></label><p className="shape-resize-note">Select the emitter, then drag any corner handle to change the area it fills.</p></div> }
function AnimationSettings({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void }) { const delay = block.animationDelay ?? 0; const duration = block.animationDuration ?? .55; const loop = block.loopAnimation ?? 'none'; const style = motionCss(block.id, block.type, { entrance: block.animation, delay, duration, loop }); return <div className="animation-settings"><style>{style}</style><p>Motion</p><label className="field"><span>Entrance</span><select value={block.animation} onChange={event => onChange({ animation: event.target.value as Animation })}><option value="none">None</option><option value="fade">Soft fade</option><option value="rise">Rise in</option><option value="pop">Playful pop</option></select></label><div className="animation-timing"><label className="field"><span>Speed</span><select value={duration} onChange={event => onChange({ animationDuration: Number(event.target.value) })}><option value=".25">Snappy</option><option value=".45">Quick</option><option value=".65">Gentle</option><option value=".9">Slow</option></select></label><label className="field"><span>Delay · {(delay / 1000).toFixed(1)}s</span><input type="range" min="0" max="1200" step="100" value={delay} onChange={event => onChange({ animationDelay: Number(event.target.value) })} /></label></div><label className="field"><span>Continuous motion</span><select value={loop} onChange={event => onChange({ loopAnimation: event.target.value as LoopAnimation })}><option value="none">None</option><option value="float">Gentle float</option><option value="spin">Continuous spin</option><option value="pulse">Soft pulse</option><option value="wiggle">Playful wiggle</option></select></label></div> }
function ButtonSettings({ block, pages, onChange }: { block: Block; pages: Page[]; onChange: (patch: Partial<Block>) => void }) { const linkType = block.buttonLinkType ?? 'none'; return <div className="button-settings"><p>Button design</p><div className="button-setting-grid"><label className="field"><span>Style</span><select value={block.buttonVariant ?? 'solid'} onChange={event => onChange({ buttonVariant: event.target.value as ButtonVariant })}><option value="solid">Solid</option><option value="soft">Soft fill</option><option value="outline">Outline</option><option value="text">Text only</option></select></label><label className="field"><span>Size</span><select value={block.buttonSize ?? 'medium'} onChange={event => onChange({ buttonSize: event.target.value as ButtonSize })}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label><label className="field"><span>Corners</span><select value={block.buttonCorner ?? 'soft'} onChange={event => onChange({ buttonCorner: event.target.value as ButtonCorner })}><option value="sharp">Sharp</option><option value="soft">Soft</option><option value="pill">Pill</option></select></label></div><div className="button-color-pair"><label className="field"><span>Accent</span><input type="color" value={block.accent ?? '#ff6b4a'} onChange={event => onChange({ accent: event.target.value })} /></label><label className="field"><span>Text</span><input type="color" value={block.buttonTextColor ?? '#ffffff'} onChange={event => onChange({ buttonTextColor: event.target.value })} /></label></div><label className="setting-toggle compact-toggle"><input type="checkbox" checked={block.showButtonArrow !== false} onChange={event => onChange({ showButtonArrow: event.target.checked })} /><span><b>Show arrow</b><small>Give the button a little direction</small></span></label><p>Button link</p><label className="field"><span>Destination</span><select value={linkType} onChange={event => onChange({ buttonLinkType: event.target.value as ButtonLinkType })}><option value="none">No link yet</option><option value="page">Another page in this portfolio</option><option value="url">Web address</option></select></label>{linkType === 'page' && <label className="field"><span>Page</span><select value={block.buttonPageId ?? ''} onChange={event => onChange({ buttonPageId: event.target.value })}><option value="">Choose a page…</option>{pages.map(page => <option key={page.id} value={page.id}>{page.name}</option>)}</select></label>}{linkType === 'url' && <Field label="Web address" value={block.buttonUrl ?? ''} onChange={buttonUrl => onChange({ buttonUrl })} />}</div> }
function FontPicker({ value, onChange }: { value: FontStyle; onChange: (font: FontStyle) => void }) {
  const [query, setQuery] = useState('')
  const matches = fontCatalog.filter(font => font.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 48)
  const featured = featuredFonts.slice(0, 3)

  // A font choice should look like itself before the person has to hover it.
  // We warm only the fonts visible in this scrolling picker, not the entire catalogue.
  useEffect(() => {
    const fontsToWarm = [...new Set([...featured.map(([, family]) => family), ...matches])]
    fontsToWarm.forEach(loadFont)
  }, [query])

  const choose = (family: string, storedValue = family) => {
    loadFont(family)
    onChange(storedValue)
  }

  return <div className="font-picker">
    <div className="font-picker-title"><span>Font library</span><small>{fontCatalog.length}+ free fonts</small></div>
    <input className="font-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search fonts…" aria-label="Search fonts" />
    <div className="font-library-scroll">
      <div className="font-featured">{featured.map(([id, family, label]) => <button type="button" key={id} className={`font-choice ${id === value ? 'chosen' : ''}`} style={{ fontFamily: fontStack(family) }} onClick={() => choose(family, id)}><b>Aa</b><small>{label}</small></button>)}</div>
      <div className="font-results">{matches.map(font => <button type="button" key={font} className={`font-choice ${font === value ? 'chosen' : ''}`} style={{ fontFamily: fontStack(font) }} onClick={() => choose(font)}><b>Aa</b><small>{font}</small></button>)}</div>
    </div>
    {matches.length === 0 && <p className="font-empty">No matching font yet.</p>}
  </div>
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><input value={value} onChange={event => onChange(event.target.value)} /></label> }
export default App
