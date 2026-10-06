export { portalDefaults as portalConfig } from '../supabase/functions/_shared/portalConfig.ts'

export {formatPortalDate} from '../supabase/functions/_shared/portalDate.ts'

export function safeReturnTo(value: string | null): string | null {
  if (!value || !/^\/(account|cart|contact)(\?|$)/.test(value) || value.includes('\\')) return null
  return value
}

export function caseLabel(value: number | string) { return Number(value) === 1 ? 'case' : 'cases' }
export const quoteLink=(number:string)=>'/account?view=quotes&request='+encodeURIComponent(number)
