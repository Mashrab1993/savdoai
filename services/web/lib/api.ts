const API_BASE_RAW = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_BASE = API_BASE_RAW.replace(/\/$/, '')  // trailing slash olib tashlash

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    // FormData uchun Content-Type'ni QO'YMASLIK kerak — browser o'zi
    // multipart/form-data; boundary=... ni qo'yadi. Aks holda server xato.
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  // URL qurish: double slash oldini olish
  const cleanPath = path.startsWith('http') ? path : (path.startsWith('/') ? path : `/${path}`)
  const url = path.startsWith('http') ? path : `${API_BASE}${cleanPath}`

  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try { detail = (await res.json()).detail || detail } catch {}
    // 401 — JWT muddati tugadi yoki noto'g'ri. Avto-logout.
    if (res.status === 401 && typeof window !== 'undefined') {
      const onLoginPage = window.location.pathname === '/login'
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user_id')
      if (!onLoginPage) {
        const next = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?next=${next}`
      }
    }
    throw new ApiError(res.status, detail)
  }

  // 204 No Content uchun JSON parse qilmaslik kerak
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) => {
    // FormData bo'lsa to'g'ridan-to'g'ri yuborish (JSON.stringify yo'q)
    if (body instanceof FormData) {
      return apiRequest<T>(path, { method: 'POST', body })
    }
    return apiRequest<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
  },
  put: <T>(path: string, body?: unknown) => {
    if (body instanceof FormData) {
      return apiRequest<T>(path, { method: 'PUT', body })
    }
    return apiRequest<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined })
  },
  patch: <T>(path: string, body?: unknown) => {
    if (body instanceof FormData) {
      return apiRequest<T>(path, { method: 'PATCH', body })
    }
    return apiRequest<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })
  },
  delete: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
}
