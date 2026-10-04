import { Link } from 'react-router-dom'
import { legalDocuments } from './legalDocuments'
import privacy from './content/privacy.md?raw'
import terms from './content/terms.md?raw'
import './LegalPage.css'

export function LegalPage({ document }: { document: keyof typeof legalDocuments }) {
  const information = legalDocuments[document]
  const content = { privacy, terms }[document].replace(/<!--[\s\S]*?-->/g, '').trim()
  return <section className="legal-page page-section">
    <h1>{information.title}</h1>
    {information.published && content ? <div className="legal-copy">{content}</div>
      : <p>Coming soon.</p>}
    <Link to="/contact">Contact NexGen</Link>
  </section>
}
