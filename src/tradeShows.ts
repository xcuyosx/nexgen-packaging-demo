export type TradeShow = {
  id: string
  name: string
  month: string
  dateRange: string
  year: string
  startDate: string
  location: string
  venue: string
  status: 'confirmed' | 'planning'
  booth?: string
  url: string
}

// Keep participation separate from event dates so the website never implies
// NexGen is attending an industry event until that appearance is confirmed.
export const tradeShows: TradeShow[] = [
  {
    id: 'nacs-show-2026',
    name: 'NACS Show 2026',
    month: 'Oct',
    dateRange: '07–09',
    year: '2026',
    startDate: '2026-10-07',
    location: 'Las Vegas, Nevada',
    venue: 'Las Vegas Convention Center',
    status: 'confirmed',
    booth: 'C3894',
    url: 'https://www.nacsshow.com/',
  },
  {
    id: 'pizza-expo-columbus-2026',
    name: 'Pizza Expo Columbus',
    month: 'Oct',
    dateRange: '11–12',
    year: '2026',
    startDate: '2026-10-11',
    location: 'Columbus, Ohio',
    venue: 'Greater Columbus Convention Center',
    status: 'planning',
    url: 'https://www.pizzaexpo.com/home/',
  },
  {
    id: 'international-pizza-expo-2027',
    name: 'International Pizza Expo',
    month: 'Apr',
    dateRange: '13–15',
    year: '2027',
    startDate: '2027-04-13',
    location: 'Las Vegas, Nevada',
    venue: 'Las Vegas Convention Center',
    status: 'planning',
    url: 'https://www.pizzaexpo.com/home/',
  },
  {
    id: 'iddba-2027',
    name: 'IDDBA 2027',
    month: 'Jun',
    dateRange: '06–08',
    year: '2027',
    startDate: '2027-06-06',
    location: 'Atlanta, Georgia',
    venue: 'Georgia World Congress Center',
    status: 'planning',
    url: 'https://www.iddba.org/iddba-show/iddba-2027',
  },
]
