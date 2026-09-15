import type { FontStyle } from './types'

export const featuredFonts = [
  ['editorial', 'Playfair Display', 'Editorial'], ['sans', 'DM Sans', 'Clean sans'], ['mono', 'DM Mono', 'Mono'], ['playful', 'DM Sans', 'Playful'], ['script', 'Playfair Display', 'Italic serif'], ['grotesk', 'Space Grotesk', 'Grotesk'], ['soft', 'Fraunces', 'Soft serif'], ['modern', 'Manrope', 'Modern'], ['display', 'Archivo Black', 'Display'],
] as const

export const fontCatalog = [
  'ABeeZee', 'Abril Fatface', 'Acme', 'Alata', 'Albert Sans', 'Alegreya', 'Alegreya Sans', 'Alfa Slab One', 'Amatic SC', 'Anton', 'Anybody', 'Arimo', 'Archivo', 'Archivo Black', 'Archivo Narrow', 'Arvo', 'Asap', 'Assistant', 'Atkinson Hyperlegible', 'Audiowide', 'B612', 'Bangers', 'Barlow', 'Barlow Condensed', 'Bebas Neue', 'Bitter', 'Bodoni Moda', 'Borel', 'Bree Serif', 'Cabin', 'Cairo', 'Candal', 'Cardo', 'Caveat', 'Chakra Petch', 'Chivo', 'Cinzel', 'Comfortaa', 'Comic Neue', 'Commissioner', 'Cormorant', 'Cormorant Garamond', 'Courier Prime', 'Crimson Pro', 'DM Mono', 'DM Sans', 'DM Serif Display', 'Dancing Script', 'Domine', 'Dosis', 'EB Garamond', 'Eczar', 'Epilogue', 'Exo 2', 'Figtree', 'Fira Code', 'Fira Sans', 'Fjalla One', 'Foldit', 'Fragment Mono', 'Fraunces', 'Fredoka', 'Fredericka the Great', 'Gaegu', 'Gabarito', 'Geist', 'Gloria Hallelujah', 'Great Vibes', 'Heebo', 'IBM Plex Mono', 'IBM Plex Sans', 'IBM Plex Serif', 'Instrument Sans', 'Instrument Serif', 'Inter', 'Inconsolata', 'Indie Flower', 'Inria Serif', 'Irish Grover', 'Josefin Sans', 'Jost', 'Kalam', 'Kanit', 'Karla', 'Kenia', 'Lato', 'League Spartan', 'Lexend', 'Libre Baskerville', 'Lilita One', 'Limelight', 'Lobster', 'Lora', 'Luckiest Guy', 'M PLUS Rounded 1c', 'Manrope', 'Merriweather', 'Merriweather Sans', 'Moirai One', 'Montserrat', 'Mulish', 'MuseoModerno', 'Nanum Myeongjo', 'Noto Sans', 'Noto Serif', 'Nunito', 'Nunito Sans', 'Old Standard TT', 'Onest', 'Open Sans', 'Orbitron', 'Oswald', 'Outfit', 'Overpass', 'Pacifico', 'Permanent Marker', 'Petrona', 'Philosopher', 'Play', 'Playfair Display', 'Plus Jakarta Sans', 'Poppins', 'Press Start 2P', 'Prata', 'Prompt', 'PT Mono', 'PT Sans', 'PT Serif', 'Public Sans', 'Questrial', 'Quicksand', 'Raleway', 'Readex Pro', 'Red Hat Display', 'Red Hat Mono', 'Roboto', 'Roboto Condensed', 'Roboto Flex', 'Roboto Mono', 'Roboto Slab', 'Rubik', 'Rufina', 'Sacramento', 'Saira', 'Satisfy', 'Scope One', 'Sen', 'Shadows Into Light', 'Share Tech Mono', 'Signika', 'Silkscreen', 'Slabo 27px', 'Space Grotesk', 'Space Mono', 'Special Elite', 'Spectral', 'Spline Sans', 'Syne', 'Teko', 'Titan One', 'Trispace', 'Ubuntu', 'Ultra', 'Unbounded', 'Urbanist', 'Varela Round', 'Vollkorn', 'VT323', 'Work Sans', 'Yeseva One', 'Zilla Slab',
]

export const fontSlug = (font: string) => font.toLowerCase().replace(/[^a-z0-9]+/g, '-')
export const fontStack = (font: string) => `'${font}', Arial, sans-serif`
export const loadFont = (font: FontStyle) => {
  const id = `folio-font-${fontSlug(font)}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${font.trim().replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`
  document.head.appendChild(link)
}
