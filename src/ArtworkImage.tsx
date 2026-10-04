import { useCallback } from 'react'
import type { ImgHTMLAttributes } from 'react'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'ref'> & { file?: File }

// Every mounted preview owns its URL. Leaving the studio revokes its URL;
// the cart creates its own from the retained File, so navigation stays safe.
export function ArtworkImage({ file, ...imageProps }: Props) {
  const attachImage = useCallback((element: HTMLImageElement | null) => {
    if (!element || !file) return
    const url = URL.createObjectURL(file)
    element.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])
  return file ? <img {...imageProps} ref={attachImage} /> : null
}
