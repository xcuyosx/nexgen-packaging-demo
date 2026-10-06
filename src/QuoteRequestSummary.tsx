import type { CustomerQuoteRequestInput } from './customerAccount'

export type QuoteReceipt = Omit<CustomerQuoteRequestInput, 'artworkFiles'> & { requestNumber: string; submittedAt: string; status?: string; issuedQuoteNumber?: string; validThrough?: string }

export function QuoteRequestSummary({ request }: { request: QuoteReceipt }) {
  const address = (value: Record<string, unknown>) => ['label','legalName','billingEmail','preference','address','city','state','postalCode','contact','phone','receivingHours','instructions'].flatMap(key => typeof value[key] === 'string' && value[key] ? [<div key={key}>{String(value[key])}</div>] : [])
  return <div className="request-summary">
    <p>Request <strong>{request.requestNumber}</strong> · Submitted {new Date(request.submittedAt).toLocaleString()}</p>
    <ol className="request-summary-lines">{request.lines.map((line,index) => <li key={index}>
      <h3>{line.productName}</h3><p>{line.sku ? `Item ${line.sku} · ` : ''}{line.cases} cases · {line.size} · {line.material}</p>
      <p>{line.printColors ? `${line.printColors}-color printing${line.inkColors.length ? ` · ${line.inkColors.join(', ')}` : ''}` : 'Unprinted'}</p>
      <p>Artwork: {[line.artworkName,...(line.additionalArtwork || []).map(file => file.name)].filter(Boolean).join(', ') || 'None'}</p>
    </li>)}</ol>
    <div className="request-summary-addresses"><section><h3>Bill to</h3>{address(request.billing).length ? address(request.billing) : <p>Billing preferences not provided.</p>}</section><section><h3>Ship to</h3>{address(request.shipping).length ? address(request.shipping) : <p>Delivery details not provided.</p>}</section></div>
    <p>Contact: {request.contact.name} · {request.contact.email}</p>
    {request.purchaseOrder && <p>PO / reference: {request.purchaseOrder}</p>}
    {request.notes && <p className="request-notes">Notes: {request.notes}</p>}
    {(!request.status || ['Submitted', 'In review'].includes(request.status)) && <><h3>What happens next</h3><ol><li>NexGen reviews your specifications and delivery requirements.</li><li>We follow up within 1 business day with pricing or any questions.</li><li>You review the quote before confirming how to proceed.</li></ol></>}
    <p>No payment is collected when you request a quote.</p>
  </div>
}
