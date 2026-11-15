import axios from 'axios'

export const client = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('triage_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('triage_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (data?.errors) {
      const first = Object.entries(data.errors as Record<string, string>)[0]
      if (first) return `${first[0]}: ${first[1]}`
    }
    return data?.message ?? err.message
  }
  return 'Something went wrong'
}
