import type { CustomerQuoteRequestInput, CustomerQuoteRequestLine } from './customerAccount'
import { artworkFileDetails, artworkNeedsReattachment, artworkStoragePath } from './artworkUpload.ts'

type Identity = { fingerprint: string; id: string; number: string }
const memory = new Map<string, Identity>()
const hash = async (bytes: BufferSource) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('')
const hashText = (value: string) => hash(new TextEncoder().encode(value))
// Preserve UUID version/variant shape for storage policies while deriving a
// repeatable object name from the content digest. It is not an access token.
const uuid = (hex: string) => `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-${((parseInt(hex[16],16) & 3) | 8).toString(16)}${hex.slice(17,20)}-${hex.slice(20,32)}`

export async function prepareQuoteAttempt(userId: string, request: CustomerQuoteRequestInput) {
  const files = new Map<number, { file: File; digest: string; extension: string; contentType: string }>()
  for (const { lineIndex, file } of request.artworkFiles || []) {
    if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= request.lines.length || files.has(lineIndex)) {
      throw new Error('The artwork selection is invalid. Reattach the file and try again.')
    }
    const details = artworkFileDetails(file)
    files.set(lineIndex, { file, digest: await hash(await file.arrayBuffer()), ...details })
  }
  // Never reuse a caller's old storage path. The fingerprint includes file bytes.
  const lines = request.lines.map((line): CustomerQuoteRequestLine => ({ ...line, artworkPath: undefined }))
  for (const [index, line] of lines.entries()) {
    const selected = files.get(index)
    if (artworkNeedsReattachment(line.artworkName, selected?.file)) throw new Error(`Reattach ${line.artworkName} before submitting your quote.`)
    if (selected && selected.file.name !== line.artworkName) throw new Error('The artwork selection changed. Reattach the file and try again.')
  }
  const fingerprint = await hashText(JSON.stringify({ userId, ...request, lines,
    artworkFiles: [...files.entries()].sort(([a], [b]) => a - b).map(([lineIndex, data]) => ({ lineIndex, digest: data.digest })) }))
  const key = `nexgen-quote-attempt-v1:${userId}`
  let saved = memory.get(key)
  try { saved = JSON.parse(window.localStorage.getItem(key) || 'null') || saved } catch { /* In-memory retry remains available. */ }
  const valid = saved && saved.fingerprint === fingerprint && /^[a-f0-9-]{36}$/i.test(saved.id)
    && /^WEB-[0-9]{8}-[A-Z0-9-]{6,36}$/.test(saved.number)
  const identity: Identity = valid ? saved! : (() => {
    const id = crypto.randomUUID()
    return { fingerprint, id, number: `WEB-${new Date().toISOString().slice(0,10).replaceAll('-', '')}-${id.slice(0,8).toUpperCase()}` }
  })()
  memory.set(key, identity)
  try { window.localStorage.setItem(key, JSON.stringify(identity)) } catch { /* No account data or file bytes are persisted. */ }
  const uploads = []
  for (const [index, selected] of files) {
    const objectId = uuid(await hashText(`${index}:${selected.digest}`))
    const path = artworkStoragePath(userId, identity.id, objectId, selected.extension)
    lines[index].artworkPath = path
    uploads.push({ ...selected, path })
  }
  return { ...identity, lines, uploads, confirm() {
    if (memory.get(key)?.id === identity.id) memory.delete(key)
    try {
      const current = JSON.parse(window.localStorage.getItem(key) || 'null')
      if (current?.id === identity.id) window.localStorage.removeItem(key)
    } catch { /* The database receipt remains the source of truth. */ }
  } }
}
