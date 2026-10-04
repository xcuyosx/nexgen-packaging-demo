import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { businessContact } from './businessContact'
import './SiteFooter.css'

export function SiteFooter() {
  return <footer className="site-footer">
    <nav className="site-footer-navigation" aria-label="Footer">
      {[
        ['/', 'Home'], ['/products', 'Products'], ['/industries', 'Industries'],
        ['/capabilities', 'Capabilities'], ['/contact', 'Contact'], ['/privacy', 'Privacy'], ['/terms', 'Terms'],
      ].map(([href, label]) => <Link key={href} to={href}>{label}</Link>)}
    </nav>
    <address className="site-footer-contact">
      <a href={businessContact.phoneHref}><Phone size={15} aria-hidden="true" />{businessContact.phone}</a>
      <a href={`mailto:${businessContact.email}`}><Mail size={15} aria-hidden="true" />{businessContact.email}</a>
      {businessContact.locations.map(location => <span key={location}><MapPin size={15} aria-hidden="true" />{location}</span>)}
    </address>
  </footer>
}
