import type { Asset, Portfolio } from './domain/types'

export type LocalProfile = {
  id: string
  name: string
  email: string
  createdAt: string
}

export type LocalWorkspace = {
  version: 1
  profile: LocalProfile
  portfolios: Portfolio[]
  assets: Asset[]
  activePortfolioId: string
}

const DATABASE = 'folio-local-workspace'
const STORE = 'workspace'
const KEY = 'current'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'))
  })
}

export async function loadLocalWorkspace(): Promise<LocalWorkspace | null> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(KEY)
    request.onsuccess = () => {
      database.close()
      const value = request.result as LocalWorkspace | undefined
      resolve(value?.version === 1 && Array.isArray(value.portfolios) && Array.isArray(value.assets) ? value : null)
    }
    request.onerror = () => { database.close(); reject(request.error ?? new Error('Could not read local workspace.')) }
  })
}

export async function saveLocalWorkspace(workspace: LocalWorkspace): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(workspace, KEY)
    transaction.oncomplete = () => { database.close(); resolve() }
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error('Could not save local workspace.')) }
    transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error('Saving was interrupted.')) }
  })
}

export function createLocalProfile(name: string, email: string): LocalProfile {
  return { id: crypto.randomUUID?.() ?? `profile-${Date.now()}`, name, email, createdAt: new Date().toISOString() }
}
