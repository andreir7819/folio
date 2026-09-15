import type { Block, BlockType, CanvasAnchorX, CanvasAnchorY, DeviceMode, PageBackground, Position, ResponsiveRange } from './types'

export const MAX_BLOCKS_PER_PAGE = 50
export const MAX_HISTORY_STEPS = 80
export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024
export const MAX_FONT_FILE_SIZE = 5 * 1024 * 1024
export const CANVAS_REFERENCE_WIDTH = 1440

export const blockInfo: Record<BlockType, { icon: string; label: string; description: string }> = {
  audio: { icon: '♫', label: 'Audio embed', description: 'Music and podcasts, by link' }, video: { icon: '▷', label: 'Video embed', description: 'Films and demos, by link' },
  text: { icon: 'T', label: 'Text', description: 'A big point of view' }, body: { icon: '¶', label: 'Rich text', description: 'A fuller explanation' }, image: { icon: '▧', label: 'Image', description: 'A visual moment' }, button: { icon: '↗', label: 'Button', description: 'A clear next step' }, project: { icon: '✦', label: 'Project card', description: 'Show your work' }, gallery: { icon: '▦', label: 'Gallery', description: 'A small visual collection' }, projectGrid: { icon: '▤', label: 'Project grid', description: 'Three projects at once' }, links: { icon: '↗', label: 'Link list', description: 'Your places online' }, quote: { icon: '“', label: 'Quote', description: 'A pull quote or praise' }, shape: { icon: '●', label: 'Shape', description: 'A playful accent' }, emitter: { icon: '✺', label: 'Particle emitter', description: 'A little ambient motion' },
}

export const trayGroups: { title: string; note: string; types: BlockType[] }[] = [
  { title: 'Start with content', note: 'The essentials for a page with a point of view.', types: ['text', 'body', 'image', 'button'] },
  { title: 'Show your work', note: 'Structured ways to present projects and places online.', types: ['project', 'gallery', 'projectGrid', 'links', 'quote'] },
  { title: 'Sound & video', note: 'Bring in media with a link.', types: ['audio', 'video'] },
  { title: 'Make it feel alive', note: 'Decorative details for a more expressive canvas.', types: ['shape', 'emitter'] },
]

export const rangeSpecs: Record<ResponsiveRange, { label: string; detail: string; resolution: string; frame: DeviceMode; overrideKey?: 'tablet' | 'phone' }> = {
  wide: { label: 'Wide', detail: '1024px and up', resolution: '1440 × 900', frame: 'laptop' },
  medium: { label: 'Medium', detail: '600–1023px', resolution: '768 × 1024', frame: 'tablet', overrideKey: 'tablet' },
  compact: { label: 'Compact', detail: 'under 600px', resolution: '390 × 844', frame: 'phone', overrideKey: 'phone' },
}

export const rangeForViewport = (): ResponsiveRange => {
  if (typeof window === 'undefined') return 'wide'
  if (window.innerWidth < 600) return 'compact'
  if (window.innerWidth < 1024) return 'medium'
  return 'wide'
}

export const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
export const defaultPosition = (index: number): Position => ({ x: 10 + (index % 3) * 17, y: 13 + index * 15 })
export const defaultBackground = (): PageBackground => ({ type: 'color', color: '#fbfaf4', gradientStart: '#e9dcff', gradientEnd: '#fff0cf', gradientAngle: 135, imageUrl: '', imageFit: 'cover' })
export const physicalAnchorPercent = (offset: number, anchor: CanvasAnchorX | CanvasAnchorY) => anchor === 'right' || anchor === 'bottom' ? 100 - offset : anchor === 'center' ? 50 + offset : offset
export const offsetFromPhysicalPercent = (position: number, anchor: CanvasAnchorX | CanvasAnchorY) => anchor === 'right' || anchor === 'bottom' ? 100 - position : anchor === 'center' ? position - 50 : position

export const makeBlock = (type: BlockType): Block => ({ id: makeId(type), type, content: type === 'audio' || type === 'video' ? '' : type === 'text' ? 'A new thought, waiting for your voice.' : type === 'body' ? 'Use this space for the details: the process, the context, and the small observations that make the work feel like yours.' : type === 'button' ? 'Let’s work together' : type === 'project' ? 'View project →' : type === 'gallery' ? 'A small collection' : type === 'projectGrid' ? 'Selected work' : type === 'links' ? 'Instagram\nBehance\nGitHub' : type === 'quote' ? 'Make the internet feel a little more human.' : type === 'shape' ? 'Decorative circle' : type === 'emitter' ? 'Star dust' : 'Drop an image here', title: type === 'project' ? 'Untitled project' : type === 'quote' ? 'A thought worth keeping' : undefined, subtitle: type === 'text' ? 'New section' : type === 'project' ? 'A short description of your work' : type === 'quote' ? '— Your name' : undefined, animation: 'fade', animationDelay: 0, animationDuration: .55, loopAnimation: 'none', accent: type === 'project' ? '#f5c6a4' : type === 'button' ? '#ff6b4a' : type === 'shape' ? '#b8a1ff' : type === 'emitter' ? '#ffbf4a' : type === 'gallery' ? '#f5c6a4' : undefined, font: type === 'text' ? 'editorial' : type === 'body' ? 'DM Sans' : undefined, buttonVariant: type === 'button' ? 'solid' : undefined, buttonSize: type === 'button' ? 'medium' : undefined, buttonCorner: type === 'button' ? 'soft' : undefined, buttonTextColor: type === 'button' ? '#ffffff' : undefined, showButtonArrow: type === 'button', buttonLinkType: type === 'button' ? 'none' : undefined, shapeType: type === 'shape' ? 'circle' : undefined, shapeScale: type === 'shape' ? 1 : undefined, emitterWidth: type === 'emitter' ? 240 : undefined, emitterHeight: type === 'emitter' ? 180 : undefined, particleStyle: type === 'emitter' ? 'stars' : undefined, particleDensity: type === 'emitter' ? 16 : undefined })
