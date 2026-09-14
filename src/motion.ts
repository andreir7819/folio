export type EntranceMotion = 'none' | 'fade' | 'rise' | 'pop'
export type LoopMotion = 'none' | 'float' | 'spin' | 'pulse' | 'wiggle'

export type MotionSettings = {
  entrance: EntranceMotion
  delay: number
  duration: number
  loop: LoopMotion
}

export const defaultMotion: MotionSettings = {
  entrance: 'fade',
  delay: 0,
  duration: 0.55,
  loop: 'none',
}

const loopTarget = (type: string) => {
  if (type === 'audio' || type === 'video') return '.media-embed'
  if (type === 'shape') return '.shape-block'
  if (type === 'image') return '.image-block'
  if (type === 'emitter') return '.particle-emitter'
  if (type === 'project') return '.project-art'
  if (type === 'gallery') return '.gallery-block'
  if (type === 'projectGrid') return '.project-grid-block'
  if (type === 'text') return 'h1'
  if (type === 'quote') return '.quote-block'
  if (type === 'body') return '.body-copy'
  return '.portfolio-button'
}

export const motionCss = (id: string, type: string, settings: MotionSettings) => {
  const entrance = `[data-block-id="${id}"].motion-${settings.entrance}{animation-duration:${settings.duration}s!important;animation-delay:${settings.delay}ms!important}`
  if (settings.loop === 'none') return entrance
  const timing = settings.loop === 'spin' ? '4s linear' : settings.loop === 'wiggle' ? '2.4s ease-in-out' : '3.2s ease-in-out'
  return `${entrance}[data-block-id="${id}"] ${loopTarget(type)}{animation:folio-${settings.loop} ${timing} ${settings.delay + settings.duration * 1000}ms infinite!important}`
}
