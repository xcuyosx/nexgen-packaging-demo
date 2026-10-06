import { useState } from 'react'
import { artworkFileDetails } from './artworkUpload'

export function AdditionalArtworkPicker({files,onChange}:{files:File[];onChange:(files:File[])=>void}) {
  const [error,setError]=useState('')
  return <div className="additional-artwork"><label>Additional artwork files<input type="file" multiple accept=".png,.jpg,.jpeg,.svg,.webp,.pdf,.ai,.eps" onChange={event=>{
    const selected=Array.from(event.target.files||[])
    try {
      if(selected.length>9)throw new Error('Attach up to 9 additional files per line.')
      selected.forEach(artworkFileDetails);onChange(selected);setError('')
    }catch(error){setError(error instanceof Error?error.message:'Unable to attach these files.')}
    event.target.value=''
  }}/></label><small>Up to 9 additional files, 10 MB each. PDF, AI and EPS attach without a preview.</small>
    {error&&<p role="alert">{error}</p>}
    <ul>{files.map((file,index)=><li key={index}>{file.name} <button type="button" aria-label={`Remove attachment ${file.name}`} onClick={()=>onChange(files.filter((_,i)=>i!==index))}>Remove</button></li>)}</ul>
  </div>
}
