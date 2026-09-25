export const artworkMaxBytes = 10 * 1024 * 1024

const artworkContentTypes: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  ai: 'application/vnd.adobe.illustrator',
  eps: 'application/postscript',
}

export function artworkFileDetails(file: Pick<File, 'name' | 'size'>): { extension: string; contentType: string } {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const contentType = artworkContentTypes[extension]
  if (!contentType) throw new Error('Choose a PNG, JPG, WebP, SVG, PDF, AI, or EPS artwork file.')
  if (!file.size || file.size > artworkMaxBytes) throw new Error('Artwork files must be 10 MB or smaller.')
  return { extension, contentType }
}

export function artworkNeedsReattachment(artworkName: string | undefined, artworkFile: File | undefined): boolean {
  return Boolean(artworkName && artworkName !== 'Artwork to follow' && !artworkFile)
}

export function artworkStoragePath(userId: string, requestId: string, objectId: string, extension: string): string {
  return `${userId}/${requestId}/${objectId}.${extension}`
}
