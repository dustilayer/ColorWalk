// Anonymous stats reporting — placeholder until Supabase is wired up.
// CSP currently has no connect-src exception, so any real network call here
// will be blocked. Keep this stubbed until backend + CSP are both ready.

const OPTIN_KEY = 'colorwalk_report_optin'

export function getReportOptIn() {
  return localStorage.getItem(OPTIN_KEY) === 'true'
}

export function setReportOptIn(value) {
  localStorage.setItem(OPTIN_KEY, value ? 'true' : 'false')
}

export async function reportIfOptedIn(_stats) {
  if (!getReportOptIn()) return
  // TODO: wire up Supabase. Send only the aggregate stats object — never
  // photos, locations, or anything that can identify a device/user. Strip
  // useDatesSet and any free-text fields before sending. Update CSP
  // connect-src to allow the Supabase project URL when re-enabling.
}
