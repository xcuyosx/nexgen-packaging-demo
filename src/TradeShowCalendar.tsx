import { ArrowUpRight, CalendarClock, MapPin } from 'lucide-react'
import { tradeShows } from './tradeShows'

export function TradeShowCalendar() {
  return (
    <section className="trade-show-section" aria-labelledby="trade-show-title">
      <div className="trade-show-heading">
        <div className="section-intro">
          <p className="eyebrow">Trade show calendar</p>
          <h2 id="trade-show-title">See what is coming up.</h2>
        </div>
        <p>
          Meet NexGen at confirmed appearances and follow the industry events shaping foodservice,
          convenience, and retail packaging.
        </p>
      </div>

      <div className="trade-show-grid">
        {tradeShows.map((event) => {
          const isConfirmed = event.status === 'confirmed'

          return (
            <article
              className={`trade-show-card ${isConfirmed ? 'trade-show-card-confirmed' : ''}`}
              key={event.id}
            >
              <div className="trade-show-card-topline">
                <time className="trade-show-date" dateTime={event.startDate}>
                  <span>{event.month}</span>
                  <strong>{event.dateRange}</strong>
                  <small>{event.year}</small>
                </time>
                <span className={`trade-show-status ${event.status}`}>
                  {isConfirmed ? 'NexGen confirmed' : 'Industry calendar'}
                </span>
              </div>

              <div className="trade-show-card-copy">
                <CalendarClock aria-hidden="true" size={19} />
                <h3>{event.name}</h3>
                <p>
                  <MapPin aria-hidden="true" size={16} />
                  <span>
                    {event.location}
                    <small>{event.venue}</small>
                  </span>
                </p>
                {event.booth && <strong className="trade-show-booth">Visit booth {event.booth}</strong>}
              </div>

              <a href={event.url} target="_blank" rel="noreferrer">
                Event details
                <ArrowUpRight aria-hidden="true" size={17} />
              </a>
            </article>
          )
        })}
      </div>

      <p className="trade-show-note">
        Only events marked “NexGen confirmed” represent an announced company appearance. Other
        dates are included as industry planning references and will be updated when participation
        is confirmed.
      </p>
    </section>
  )
}
