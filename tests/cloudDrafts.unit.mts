import assert from 'node:assert/strict'
import test from 'node:test'
import { createCloudDraftRepository, toDraftSnapshot, type DraftRow } from '../src/cloudDrafts.ts'
import type { LocalWorkspace } from '../src/localWorkspace.ts'
import type { Portfolio } from '../src/domain/types.ts'

const ownerId = 'owner-one'
const workspace: LocalWorkspace = {
  version: 1,
  profile: { id: 'local', name: 'Local', email: 'local@example.test', createdAt: '' },
  portfolios: [{ id: 'portfolio-one', publishedAt: '2026-01-01', pages: [] } as unknown as Portfolio],
  assets: [],
  activePortfolioId: 'portfolio-one',
}

test('cloud snapshots preserve editor content and omit local identity and publishing state', () => {
  const snapshot = toDraftSnapshot(workspace)
  assert.equal(snapshot.portfolios[0].id, 'portfolio-one')
  assert.equal(snapshot.portfolios[0].publishedAt, undefined)
  assert.equal('profile' in snapshot, false)
  assert.equal(workspace.portfolios[0].publishedAt, '2026-01-01')
})

test('each write uses the owner and the loaded revision, and rejects a stale writer', async () => {
  const rows = new Map<string, DraftRow>()
  const repository = createCloudDraftRepository({
    async read(owner) { return rows.get(owner) ?? null },
    async write(owner, expected, row) {
      if ((rows.get(owner)?.revision ?? null) !== expected) return false
      rows.set(owner, row)
      return true
    },
  })
  const signal = new AbortController().signal
  const firstRevision = await repository.save(ownerId, null, workspace, signal)
  const loaded = await repository.load(ownerId, signal)
  assert.equal(loaded?.revision, firstRevision)
  assert.equal(await repository.load('owner-two', signal), null)
  const secondRevision = await repository.save(ownerId, firstRevision, workspace, signal)
  assert.notEqual(secondRevision, firstRevision)
  await assert.rejects(repository.save(ownerId, firstRevision, workspace, signal), /changed in another session/)
})
