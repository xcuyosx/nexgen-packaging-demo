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
  const files = new Map<string, { file: File; digest: string; extension: string; contentType: string; lineIndex:number; attachmentIndex?:number }>()
  for (const { lineIndex, file, attachmentIndex } of request.artworkFiles || []) {
    const key = `${lineIndex}:${attachmentIndex ?? 'primary'}`
    if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= request.lines.length || files.has(key)
      || (attachmentIndex !== undefined && (!Number.isInteger(attachmentIndex) || attachmentIndex < 0 || attachmentIndex > 8))) {
      throw new Error('The artwork selection is invalid. Reattach the file and try again.')
    }
    const details = artworkFileDetails(file)
    files.set(key, { file, digest: await hash(await file.arrayBuffer()), lineIndex, attachmentIndex, ...details })
  }
  // Never reuse a caller's old storage path. The fingerprint includes file bytes.
  const lines = request.lines.map((line): CustomerQuoteRequestLine => ({ ...line, artworkPath: undefined,
    additionalArtwork: line.additionalArtwork?.map(file=>({name:file.name})),
  }))
  for (const [index, line] of lines.entries()) {
    const selected = files.get(`${index}:primary`)
    if (artworkNeedsReattachment(line.artworkName, selected?.file)) throw new Error(`Reattach ${line.artworkName} before submitting your quote.`)
    if (selected && selected.file.name !== line.artworkName) throw new Error('The artwork selection changed. Reattach the file and try again.')
    if ((line.additionalArtwork?.length || 0) > 9) throw new Error('Attach up to 9 additional artwork files per line.')
    for (const [attachmentIndex,attachment] of (line.additionalArtwork || []).entries()) {
      if (files.get(`${index}:${attachmentIndex}`)?.file.name !== attachment.name) throw new Error(`Reattach ${attachment.name} before submitting your quote.`)
    }
  }
  const fingerprint = await hashText(JSON.stringify({ userId, ...request, lines,
    // Keep the original primary-file fingerprint so pending submissions survive an upgrade.
    artworkFiles: [...files.values()].sort((a, b) => a.lineIndex - b.lineIndex || (a.attachmentIndex ?? -1) - (b.attachmentIndex ?? -1))
      .map(data => ({ lineIndex: data.lineIndex, digest: data.digest, ...(data.attachmentIndex === undefined ? {} : { attachmentIndex: data.attachmentIndex }) })) }))
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
  for (const selected of files.values()) {
    const objectKey = selected.attachmentIndex === undefined ? String(selected.lineIndex) : `${selected.lineIndex}:${selected.attachmentIndex}`
    const objectId = uuid(await hashText(`${objectKey}:${selected.digest}`))
    const path = artworkStoragePath(userId, identity.id, objectId, selected.extension)
    if(selected.attachmentIndex === undefined) lines[selected.lineIndex].artworkPath = path
    else {
      const attachment=lines[selected.lineIndex].additionalArtwork?.[selected.attachmentIndex]
      if(!attachment || attachment.name !== selected.file.name) throw new Error('The artwork selection does not match the request.')
      attachment.path = path
    }
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
