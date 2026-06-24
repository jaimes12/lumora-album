const BASE = import.meta.env.VITE_API_URL ?? 'https://api.elixe.mx'

export async function getPublicPlans() {
  const res = await fetch(`${BASE}/api/plans`)
  if (!res.ok) throw new Error('Could not load plans')
  return res.json()
}
