import { apiRequest } from "./client"

export type InvoiceItemDto = { description: string; qty: number; unitPrice: number }
export type InvoiceDto = {
  id: string
  invoiceNumber: string
  clientId: string
  clientName: string
  items: InvoiceItemDto[]
  subtotal: number
  tax: number
  total: number
  status: string
  issueDate: string
  dueDate: string
}

export async function getInvoices() {
  return apiRequest<InvoiceDto[]>("/api/invoices")
}
