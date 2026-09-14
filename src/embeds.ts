export type EmbedKind = 'audio' | 'video'
export function resolveEmbed(raw: string, kind: EmbedKind): { src: string; provider: string } | null {
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
    const host = url.hostname.replace(/^www\./, '')
    if (kind === 'video') {
      if (['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
        const id = host === 'youtu.be' ? url.pathname.slice(1) : url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/)?.[1]
        if (id && /^[\w-]{11}$/.test(id)) return { provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1` }
      }
      if (['vimeo.com', 'player.vimeo.com'].includes(host)) {
        const match = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/)
        if (match) {
          const params = new URLSearchParams({ dnt: '1' })
          const hash = match[2] ?? url.searchParams.get('h')
          if (hash && /^[a-zA-Z0-9]+$/.test(hash)) params.set('h', hash)
          return { provider: 'Vimeo', src: `https://player.vimeo.com/video/${match[1]}?${params}` }
        }
      }
    } else {
      if (host === 'open.spotify.com') {
        const match = url.pathname.match(/^\/(?:intl-[a-z]+\/)?(?:embed\/)?(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]{22})\/?$/)
        if (match) return { provider: 'Spotify', src: `https://open.spotify.com/embed/${match[1]}/${match[2]}` }
      }
      if (host === 'soundcloud.com' && /^\/[\w-]+\/(?:sets\/)?[\w-]+\/?$/.test(url.pathname)) {
        const params = new URLSearchParams({ url: `https://soundcloud.com${url.pathname}`, auto_play: 'false', visual: 'false' })
        return { provider: 'SoundCloud', src: `https://w.soundcloud.com/player/?${params}` }
      }
    }
  } catch { /* An incomplete link is normal while typing. */ }
  return null
}
