import { Link } from 'react-router-dom'
import './NotFoundPage.css'

export function NotFoundPage() {
  return <section className="page-section not-found-page" aria-labelledby="not-found-title">
    <p className="eyebrow">404</p>
    <h1 id="not-found-title">Page not found</h1>
    <p>We couldn’t find that page. Browse our products or contact the NexGen team for help.</p>
    <div className="not-found-actions">
      <Link className="primary-button" to="/products">Browse products</Link>
      <Link className="secondary-button" to="/contact">Contact NexGen</Link>
    </div>
  </section>
}
