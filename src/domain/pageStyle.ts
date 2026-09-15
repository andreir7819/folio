import type { CSSProperties } from 'react'
import type { PageBackground } from './types'

export const pageBackgroundStyle = (background: PageBackground): CSSProperties => {
  if (background.type === 'gradient') return { backgroundImage: `linear-gradient(${background.gradientAngle}deg, ${background.gradientStart}, ${background.gradientEnd})` }
  if (background.type === 'image' && background.imageUrl) return { backgroundImage: `url("${background.imageUrl}")`, backgroundPosition: 'center', backgroundRepeat: background.imageFit === 'repeat' ? 'repeat' : 'no-repeat', backgroundSize: background.imageFit === 'stretch' ? '100% 100%' : background.imageFit === 'repeat' ? 'auto' : background.imageFit }
  return { backgroundColor: background.color }
}
