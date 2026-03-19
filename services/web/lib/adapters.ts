// API dan kelgan O'zbek field nomlarini UI field nomlariga moslashtirish

export function adaptClient(apiClient: Record<string, unknown>) {
  return {
    id: String(apiClient.id ?? ''),
    name: String(apiClient.ism ?? apiClient.name ?? ''),
    email: String(apiClient.email ?? ''),
    phone: String(apiClient.telefon ?? apiClient.phone ?? ''),
    company: String(apiClient.dokon_nomi ?? apiClient.company ?? ''),
    status: (apiClient.faol === false ? 'inactive' : 'active') as 'active' | 'inactive' | 'prospect',
    totalPurchases: Number(apiClient.jami_sotuv ?? 0),
    totalDebt: Number(apiClient.qarz ?? apiClient.aktiv_qarz ?? 0),
    joinedAt: String(apiClient.yaratilgan ?? apiClient.joinedAt ?? ''),
  }
}

export function adaptProduct(apiProduct: Record<string, unknown>) {
  const qoldiq = Number(apiProduct.qoldiq ?? apiProduct.stock ?? 0)
  const minQoldiq = Number(apiProduct.min_qoldiq ?? 10)
  return {
    id: String(apiProduct.id ?? ''),
    name: String(apiProduct.nomi ?? apiProduct.name ?? ''),
    sku: String(apiProduct.sku ?? `SKU-${apiProduct.id ?? ''}`),
    category: String(apiProduct.kategoriya ?? apiProduct.category ?? ''),
    price: Number(apiProduct.sotish_narxi ?? apiProduct.price ?? 0),
    costPrice: Number(apiProduct.olish_narxi ?? 0),
    stock: qoldiq,
    lowStockThreshold: minQoldiq,
    description: String(apiProduct.izoh ?? ''),
    status: (qoldiq <= 0 ? 'out-of-stock' : qoldiq <= minQoldiq ? 'low-stock' : 'in-stock') as 'in-stock' | 'low-stock' | 'out-of-stock',
    unit: String(apiProduct.birlik ?? 'dona'),
  }
}

export function adaptDebt(apiDebt: Record<string, unknown>) {
  return {
    id: String(apiDebt.id ?? apiDebt.klient_ismi ?? ''),
    clientId: String(apiDebt.klient_id ?? ''),
    clientName: String(apiDebt.klient_ismi ?? ''),
    amount: Number(apiDebt.qolgan ?? 0),
    paid: 0,
    dueDate: String(apiDebt.eng_yaqin_muddat ?? ''),
    status: 'pending' as const,
    invoiceRef: String(apiDebt.invoice_ref ?? ''),
    count: Number(apiDebt.qarz_soni ?? 1),
  }
}

export function adaptDashboard(apiDash: Record<string, unknown>) {
  return {
    totalRevenue: Number(apiDash.bugungi_sotuv ?? 0),
    totalDebt: Number(apiDash.jami_qarz ?? 0),
    activeClients: Number(apiDash.klient_soni ?? 0),
    totalProducts: Number(apiDash.tovar_soni ?? 0),
    cashBalance: Number(apiDash.kassa_balans ?? 0),
    todayIncome: Number(apiDash.bugungi_kirim ?? 0),
  }
}

export function adaptInvoice(apiInv: Record<string, unknown>) {
  const items = Array.isArray(apiInv.tovarlar)
    ? (apiInv.tovarlar as Record<string, unknown>[]).map((t: Record<string, unknown>) => ({
        description: String(t.nomi ?? t.description ?? ''),
        qty: Number(t.miqdor ?? t.qty ?? 0),
        unitPrice: Number(t.narx ?? t.unitPrice ?? 0),
      }))
    : []
  const jami = Number(apiInv.jami_summa ?? apiInv.total ?? 0)
  return {
    id: String(apiInv.id ?? ''),
    invoiceNumber: String(apiInv.raqam ?? apiInv.invoiceNumber ?? ''),
    clientId: String(apiInv.klient_id ?? ''),
    clientName: String(apiInv.klient_ismi ?? apiInv.clientName ?? ''),
    items,
    subtotal: jami,
    tax: 0,
    total: jami,
    status: (apiInv.holati ?? 'sent') as 'draft' | 'sent' | 'paid' | 'overdue',
    issueDate: String(apiInv.sana ?? apiInv.issueDate ?? ''),
    dueDate: String(apiInv.muddat ?? apiInv.dueDate ?? ''),
  }
}

export function adaptExpense(apiExp: Record<string, unknown>) {
  return {
    id: String(apiExp.id ?? ''),
    title: String(apiExp.sarlavha ?? apiExp.title ?? ''),
    category: String(apiExp.turi ?? apiExp.category ?? ''),
    amount: Number(apiExp.summa ?? apiExp.amount ?? 0),
    requestedBy: String(apiExp.kim_talab_qildi ?? apiExp.requestedBy ?? ''),
    approvedBy: apiExp.approvedBy != null ? String(apiExp.approvedBy) : undefined,
    status: (apiExp.tasdiqlandi === true ? 'approved' : apiExp.tasdiqlandi === false ? 'rejected' : 'pending') as 'pending' | 'approved' | 'rejected',
    date: String(apiExp.sana ?? apiExp.date ?? ''),
    notes: apiExp.izoh != null ? String(apiExp.izoh) : undefined,
  }
}

export function adaptApprentice(apiAp: Record<string, unknown>) {
  return {
    id: String(apiAp.id ?? ''),
    name: String(apiAp.ism ?? apiAp.name ?? ''),
    role: String(apiAp.lavozim ?? apiAp.role ?? ''),
    phone: String(apiAp.telefon ?? apiAp.phone ?? ''),
    status: (apiAp.faol === false ? 'inactive' : 'active') as 'active' | 'inactive',
    dailyLimit: Number(apiAp.kunlik_limiti ?? 0),
    monthlyLimit: Number(apiAp.oylik_limiti ?? 0),
    spentToday: Number(apiAp.bugungi_xarajat ?? 0),
    spentThisMonth: Number(apiAp.oylik_xarajat ?? 0),
    joinedAt: String(apiAp.qoshilgan ?? apiAp.joinedAt ?? ''),
  }
}

export function adaptPriceGroup(apiPg: Record<string, unknown>) {
  return {
    id: String(apiPg.id ?? ''),
    name: String(apiPg.nomi ?? apiPg.name ?? ''),
    discount: Number(apiPg.chegirma ?? apiPg.discount ?? 0),
    description: String(apiPg.izoh ?? apiPg.description ?? ''),
    clientIds: Array.isArray(apiPg.klient_ids) ? (apiPg.klient_ids as unknown[]).map(String) : [],
  }
}

export function adaptCashTransaction(apiTx: Record<string, unknown>) {
  return {
    id: String(apiTx.id ?? ''),
    type: (apiTx.turi === 'chiqim' ? 'outcome' : 'income') as 'income' | 'outcome',
    amount: Number(apiTx.summa ?? apiTx.amount ?? 0),
    description: String(apiTx.izoh ?? apiTx.description ?? ''),
    category: String(apiTx.turi ?? apiTx.category ?? ''),
    date: String(apiTx.sana ?? apiTx.date ?? ''),
    time: String(apiTx.vaqt ?? apiTx.time ?? ''),
    performedBy: String(apiTx.kim ?? apiTx.performedBy ?? ''),
  }
}
