import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const functionsBase = supabaseUrl ? `${supabaseUrl}/functions/v1/prizm-api` : ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

async function request(path, options = {}) {
  if (!functionsBase || !supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정하세요.')
  }
  const response = await fetch(`${functionsBase}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
      ...(options.headers || {}),
    },
    ...options,
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const error = new Error(data?.message || '요청에 실패했습니다.')
    error.code = data?.error
    throw error
  }
  return data
}

export const api = {
  health: () => request('/health'),
  createSpace: (name) => request('/spaces', { method: 'POST', body: JSON.stringify({ name }) }),
  joinSpace: (code, body) =>
    request(`/spaces/${encodeURIComponent(code)}/join`, { method: 'POST', body: JSON.stringify(body) }),
  getSpace: (id) => request(`/spaces/${id}`),
  getGraph: (id) => request(`/spaces/${id}/graph`),
  listArtifacts: (spaceId) => request(`/spaces/${spaceId}/artifacts`),
  createArtifact: (spaceId, body) =>
    request(`/spaces/${spaceId}/artifacts`, { method: 'POST', body: JSON.stringify(body) }),
  getArtifact: (id) => request(`/artifacts/${id}`),
  getGroup: (id) => request(`/groups/${id}`),
}
