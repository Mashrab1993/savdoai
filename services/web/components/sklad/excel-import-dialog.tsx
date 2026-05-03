"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { api, ApiError } from "@/lib/api"
import { X, Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

type Result = {
  jami: number
  yaratildi: number
  yangilandi: number
  xatolar: string[]
}

type ShablonResp = {
  filename: string
  content_base64: string
}

export function ExcelImportDialog({ open, onClose, onImported }: {
  open: boolean
  onClose: () => void
  onImported?: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [shablonBusy, setShablonBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const reset = () => {
    setFile(null); setBusy(false); setError(null); setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const close = () => { reset(); onClose() }

  const downloadShablon = async () => {
    setShablonBusy(true); setError(null)
    try {
      const data = await api.get<ShablonResp>("/api/v1/tovar/shablon/excel")
      const bin = atob(data.content_base64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = data.filename || "SavdoAI_Tovar_Shablon.xlsx"
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : (e as Error).message || "Shablon yuklanmadi")
    } finally {
      setShablonBusy(false)
    }
  }

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f); setError(null); setResult(null)
  }

  const upload = async () => {
    if (!file) return
    setBusy(true); setError(null); setResult(null)
    try {
      const buf = await file.arrayBuffer()
      const bytes = new Uint8Array(buf)
      let bin = ""
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
      const b64 = btoa(bin)
      const res = await api.post<Result>("/api/v1/tovar/import/excel", { file_base64: b64 })
      setResult(res)
      onImported?.()
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : (e as Error).message || "Yuklash muvaffaqiyatsiz")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E8E0D3] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E0D3] bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#0A819C]" />
            <h2 className="text-lg font-semibold text-[#2D2418]">Excel orqali tovar yuklash</h2>
          </div>
          <button onClick={close} className="text-[#6B5B4D] hover:text-[#2D2418]" aria-label="Yopish">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-lg bg-[#FCF9F4] border border-[#E8E0D3] p-4">
            <p className="text-sm text-[#6B5B4D] mb-3">
              <strong className="text-[#2D2418]">1-qadam:</strong> Avval shablonni yuklab oling, to'ldiring va qaytarib yuklang.
            </p>
            <Button
              onClick={downloadShablon}
              disabled={shablonBusy}
              className="w-full bg-white border border-[#E8E0D3] text-[#2D2418] hover:bg-[#FAF7F2]"
            >
              {shablonBusy
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Tayyorlanmoqda...</>
                : <><Download className="w-4 h-4 mr-2" /> Shablon (.xlsx) yuklab olish</>}
            </Button>
          </div>

          <div className="rounded-lg bg-[#FCF9F4] border border-[#E8E0D3] p-4">
            <p className="text-sm text-[#6B5B4D] mb-3">
              <strong className="text-[#2D2418]">2-qadam:</strong> To'ldirilgan .xlsx faylni tanlang. Bir so'rovda max 1000 ta tovar.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={onPickFile}
              className="block w-full text-sm text-[#6B5B4D] file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#0A819C]/10 file:text-[#0A819C] hover:file:bg-[#0A819C]/20"
            />
            {file && (
              <p className="mt-2 text-xs text-[#6B5B4D]">
                Tanlandi: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {result && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm">
              <div className="flex items-center gap-2 text-green-800 font-medium mb-1">
                <CheckCircle2 className="w-4 h-4" /> Yuklandi
              </div>
              <div className="text-green-700">
                Jami: <strong>{result.jami}</strong> ·
                Yangi: <strong>{result.yaratildi}</strong> ·
                Yangilandi: <strong>{result.yangilandi}</strong>
              </div>
              {result.xatolar.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-amber-700 text-xs">
                    {result.xatolar.length} ta xato (batafsil)
                  </summary>
                  <ul className="mt-1 text-xs text-amber-800 list-disc list-inside">
                    {result.xatolar.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E8E0D3] bg-[#FAF7F2]">
          <Button onClick={close} className="bg-white border border-[#E8E0D3] text-[#2D2418] hover:bg-[#FAF7F2]">
            {result ? "Yopish" : "Bekor qilish"}
          </Button>
          <Button
            onClick={upload}
            disabled={!file || busy}
            style={{ background: "#C75D3C" }}
            className="text-white"
          >
            {busy
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Yuklanmoqda...</>
              : <><Upload className="w-4 h-4 mr-2" /> Yuklash</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
