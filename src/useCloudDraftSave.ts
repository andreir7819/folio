import { useEffect, useRef, useState } from 'react'
import type { supabaseCloudDraftRepository } from './cloudDrafts'
import type { LocalWorkspace } from './localWorkspace'

type SaveStatus = 'saved' | 'saving' | 'error'

export function useCloudDraftSave(
  repository: ReturnType<typeof supabaseCloudDraftRepository> | null,
  ownerId: string | undefined,
  workspace: LocalWorkspace,
  loaded: { workspace: LocalWorkspace; revision: string | null } | null,
) {
  const revision = useRef<string | null>(null)
  const queue = useRef(Promise.resolve())
  const [savedWorkspace, setSavedWorkspace] = useState<LocalWorkspace | null>(null)
  const [failure, setFailure] = useState('')
  const [attempt, setAttempt] = useState(0)
  const unsaved = !!loaded && (savedWorkspace ?? loaded.workspace) !== workspace
  const status: SaveStatus = failure ? 'error' : unsaved ? 'saving' : 'saved'

  const lifetime = useRef<AbortController | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (loaded) revision.current = loaded.revision
  }, [loaded])

  useEffect(() => {
    if (!repository || !ownerId || !loaded || !unsaved) return
    const signal = lifetime.current?.signal
    if (!signal) return
    let current = true
    const timer = window.setTimeout(() => {
      queue.current = queue.current.then(async () => {
        if (!current || signal.aborted) return
        try {
          revision.current = await repository.save(ownerId, revision.current, workspace, signal)
          if (!signal.aborted) setSavedWorkspace(workspace)
          if (current && !signal.aborted) setFailure('')
        } catch (error) {
          if (current && !signal.aborted) setFailure(error instanceof Error ? error.message : 'Your latest changes are still open here. Try saving again.')
        }
      })
    }, 350)
    return () => { current = false; window.clearTimeout(timer) }
  }, [repository, ownerId, workspace, loaded, unsaved, attempt])


  useEffect(() => {
    if (!unsaved) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  return { status, unsaved, failure, retry: () => { setFailure(''); setAttempt(value => value + 1) } }
}
