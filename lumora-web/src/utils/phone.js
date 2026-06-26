// Normalizes a Mexican phone number to the WhatsApp format: 521XXXXXXXXXX
// Handles inputs:
//   "4494924132"       (10 digits bare)   → "5214494924132"
//   "524494924132"     (old +52 format)   → "5214494924132"
//   "5214494924132"    (already correct)  → "5214494924132"
export function normalizeMxPhone(raw) {
  const d = (raw || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.length === 10) return '521' + d
  if (d.length === 12 && d.startsWith('52') && !d.startsWith('521')) return '521' + d.slice(2)
  return d
}

// Returns last 10 digits of a phone for comparison
export function last10(phone) {
  return (phone || '').replace(/\D/g, '').slice(-10)
}
