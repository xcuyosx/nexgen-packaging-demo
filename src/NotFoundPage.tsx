import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './NotFoundPage.css'

export function NotFoundPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Page not found | NexGen Packaging Group'
    const existing = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const robots = existing ?? document.createElement('meta')
    const previousRobots = robots.getAttribute('content')
    robots.name = 'robots'
    robots.content = 'noindex'
    if (!existing) document.head.appendChild(robots)
    return () => {
      document.title = previousTitle
      if (!existing) robots.remove()
      else if (previousRobots === null) robots.removeAttribute('content')
      else robots.content = previousRobots
    }
  }, [])

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
