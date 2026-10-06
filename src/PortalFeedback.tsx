import type { QuoteReceipt } from './QuoteRequestSummary'

export function PortalSkeleton({ label = 'Loading your account…' }: { label?: string }) {
  return <div className="portal-skeleton" role="status" aria-label={label}><span>{label}</span><i /><i /><i /></div>
}

export function PortalError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="portal-error" role="alert"><p>{message}</p><button type="button" onClick={onRetry}>Retry</button></div>
}

export function RequestActions({ request, onRequestAgain }: { request: QuoteReceipt; onRequestAgain: (request: QuoteReceipt) => void }) {
  return <div className="request-actions no-print"><div>
    <button type="button" onClick={() => window.print()}>Print / Save as PDF</button>
    <button type="button" onClick={() => onRequestAgain(request)}>Request again</button>
  </div><small>Request again copies the items to your cart. Reattach artwork before submitting.</small></div>
}
