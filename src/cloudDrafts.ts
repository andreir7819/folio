import type { SupabaseClient } from '@supabase/supabase-js'
import type { LocalWorkspace } from './localWorkspace'

export type DraftSnapshot = Omit<LocalWorkspace, 'profile'>
export type DraftRow = { revision: string; snapshot: DraftSnapshot }

type DraftStore = {
  read(ownerId: string, signal: AbortSignal): Promise<DraftRow | null>
  write(ownerId: string, expectedRevision: string | null, row: DraftRow, signal: AbortSignal): Promise<boolean>
}

export function toDraftSnapshot({ version, portfolios, assets, activePortfolioId }: LocalWorkspace): DraftSnapshot {
  return {
    version,
    portfolios: portfolios.map(portfolio => ({ ...portfolio, publishedAt: undefined })),
    assets,
    activePortfolioId,
  }
}

export function createCloudDraftRepository(store: DraftStore) {
  return {
    load(ownerId: string, signal: AbortSignal) {
      return store.read(ownerId, signal)
    },
    async save(ownerId: string, expectedRevision: string | null, workspace: LocalWorkspace, signal: AbortSignal) {
      const revision = crypto.randomUUID()
      const saved = await store.write(ownerId, expectedRevision, { revision, snapshot: toDraftSnapshot(workspace) }, signal)
      if (!saved) throw new Error('This draft changed in another session. Reload to open the latest saved version.')
      return revision
    },
  }
}

export function supabaseCloudDraftRepository(client: SupabaseClient) {
  return createCloudDraftRepository({
    async read(ownerId, signal) {
      const { data, error } = await client.from('cloud_drafts')
        .select('revision, snapshot').eq('owner_id', ownerId).abortSignal(signal).maybeSingle()
      if (error) throw error
      return data
    },
    async write(ownerId, expectedRevision, row, signal) {
      if (expectedRevision === null) {
        const { data, error } = await client.from('cloud_drafts')
          .insert({ ...row, owner_id: ownerId }).select('revision').abortSignal(signal).single()
        if (error?.code === '23505') return false
        if (error) throw error
        return data.revision === row.revision
      }

      const { data, error } = await client.from('cloud_drafts')
        .update(row).eq('owner_id', ownerId).eq('revision', expectedRevision)
        .select('revision').abortSignal(signal).maybeSingle()
      if (error) throw error
      return data?.revision === row.revision
    },
  })
}
