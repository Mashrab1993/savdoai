const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

class SavdoAPI {
  private token: string | null = null

  setToken(t: string) {
    this.token = t
    if (typeof window !== 'undefined') localStorage.setItem('savdoai_token', t)
  }

  getToken(): string | null {
    if (this.token) return this.token
    if (typeof window !== 'undefined') this.token = localStorage.getItem('savdoai_token')
    return this.token
  }

  private async req(endpoint: string, opts: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((opts.headers as Record<string, string>) || {}),
    }
    const token = this.getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_URL}${endpoint}`, { ...opts, headers })

    if (res.status === 401) {
      this.token = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('savdoai_token')
        window.location.href = '/login'
      }
      throw new Error('Avtorizatsiya xatosi')
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Xato: ${res.status}`)
    }
    return res.json()
  }

  // Auth
  async loginTelegram(initData: string) {
    return this.req('/auth/telegram', { method: 'POST', body: JSON.stringify({ init_data: initData }) })
  }
  async getMe() { return this.req('/api/v1/me') }

  // Dashboard
  async getDashboard() { return this.req('/api/v1/dashboard') }

  // Klientlar
  async getKlientlar(limit = 50, offset = 0, qidiruv?: string) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (qidiruv) params.set('qidiruv', qidiruv)
    return this.req(`/api/v1/klientlar?${params}`)
  }
  async createKlient(data: any) {
    return this.req('/api/v1/klient', { method: 'POST', body: JSON.stringify(data) })
  }

  // Tovarlar
  async getTovarlar(limit = 50, offset = 0, kategoriya?: string) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (kategoriya) params.set('kategoriya', kategoriya)
    return this.req(`/api/v1/tovarlar?${params}`)
  }
  async getTovar(id: number) { return this.req(`/api/v1/tovar/${id}`) }

  // Qarzlar
  async getQarzlar() { return this.req('/api/v1/qarzlar') }
  async qarzTolash(data: { klient_ismi: string; summa: number }) {
    return this.req('/api/v1/qarz/tolash', { method: 'POST', body: JSON.stringify(data) })
  }

  // Hisobotlar
  async getKunlik() { return this.req('/api/v1/hisobot/kunlik') }
  async getHaftalik() { return this.req('/api/v1/hisobot/haftalik') }
  async getOylik() { return this.req('/api/v1/hisobot/oylik') }

  // Sotuv / Kirim
  async sotuv(data: any) {
    return this.req('/api/v1/sotuv', { method: 'POST', body: JSON.stringify(data) })
  }
  async kirim(data: any) {
    return this.req('/api/v1/kirim', { method: 'POST', body: JSON.stringify(data) })
  }

  // Search
  async search(q: string) {
    return this.req(`/api/v1/search?q=${encodeURIComponent(q)}`)
  }

  // Shogirdlar
  async getShogirdlar() { return this.req('/api/v1/shogirdlar') }
  async getShogirdDashboard() { return this.req('/api/v1/shogird/dashboard') }

  // Xarajatlar
  async getBugungiXarajatlar() { return this.req('/api/v1/xarajatlar/bugungi') }
  async getOylikXarajatlar() { return this.req('/api/v1/xarajatlar/oylik') }

  // Narxlar
  async getNarxGuruhlar() { return this.req('/api/v1/narx/guruhlar') }
  async narxGuruhYarat(data: { nomi: string; izoh?: string }) {
    return this.req('/api/v1/narx/guruh', { method: 'POST', body: JSON.stringify(data) })
  }
  async narxQoyish(data: { guruh_id: number; tovar_id: number; narx: number }) {
    return this.req('/api/v1/narx/qoyish', { method: 'POST', body: JSON.stringify(data) })
  }

  // Ledger
  async getBalans() { return this.req('/api/v1/ledger/balans') }
  async getJurnal() { return this.req('/api/v1/ledger/jurnal') }

  // Export
  async exportData(data: any) {
    return this.req('/api/v1/export', { method: 'POST', body: JSON.stringify(data) })
  }

  // Health
  async health() { return this.req('/health') }
}

export const api = new SavdoAPI()
