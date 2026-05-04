"use client"
import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

interface VoiceCommand {
  text: string
  intent?: string
  result?: string
}

export function VoiceButton() {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [open, setOpen] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [history, setHistory] = useState<VoiceCommand[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const cancelledRef = useRef(false)

  // Component unmount paytida MediaRecorder + stream tozalash
  // Aks holda mikrofon ko'k indikator yonib qoladi va RAM leak bo'ladi.
  useEffect(() => {
    return () => {
      cancelledRef.current = true
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
      } catch {}
      try {
        streamRef.current?.getTracks().forEach(t => t.stop())
      } catch {}
    }
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
        if (cancelledRef.current) return  // unmount bo'lgan bo'lsa state set qilmaslik
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await processAudio(blob)
      }

      recorder.start()
      setRecording(true)
      toast.info("Ovoz yozilmoqda... Tugmani qaytadan bosib to'xtating")
    } catch (e) {
      toast.error("Mikrofonga ruxsat berilmagan")
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  async function processAudio(blob: Blob) {
    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'voice.webm')
      // Markaziy api.post endi FormData'ni to'g'ri qo'llaydi (Content-Type
      // qo'ymaslik kerak — browser o'zi multipart boundary qo'yadi)
      const data = await api.post<{ text?: string; intent?: string; result?: string }>(
        '/api/v1/voice/process',
        formData
      )
      if (cancelledRef.current) return  // unmount bo'lgan bo'lsa state set qilmaslik
      setTranscript(data?.text || '')
      setHistory(prev => [{ text: data?.text || '', intent: data?.intent, result: data?.result }, ...prev])
      toast.success("Tushundim: " + (data?.intent || data?.text || ''))
    } catch (e: any) {
      if (cancelledRef.current) return
      toast.error(e?.detail || e?.message || "Voice xato")
    } finally {
      if (!cancelledRef.current) setProcessing(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
        title="Ovozli komanda"
      >
        <Mic className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 p-4" onClick={() => !recording && setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" /> Ovozli komanda
              </h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded">×</button>
            </div>

            <div className="text-center py-6">
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={processing}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  recording
                    ? 'bg-rose-500 hover:bg-rose-600 ring-8 ring-rose-200 animate-pulse'
                    : processing
                    ? 'bg-slate-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105'
                }`}
              >
                {processing ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : recording ? (
                  <MicOff className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </button>
              <p className="text-sm text-slate-600 mt-3">
                {recording ? "🔴 Ovoz yozilmoqda... Bosib to'xtating" :
                 processing ? "⚙️ Qayta ishlanmoqda..." :
                 "Tugmani bosing va aytib bering"}
              </p>
            </div>

            {/* Examples */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">Ovozli komanda misollari:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• "Salimovga 50 ta Ariel qarzga"</li>
                <li>• "100 ta un kirdi narxi 35,000"</li>
                <li>• "Yangi klient Karim aka 95 259 99 00"</li>
                <li>• "Bu hafta sotuvlar qanday?"</li>
                <li>• "Qaysi klientlar muammoli?"</li>
              </ul>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Tarix:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {history.slice(0, 5).map((h, i) => (
                    <div key={i} className="bg-emerald-50 rounded-lg p-2 text-sm">
                      <div className="font-medium">{h.text}</div>
                      {h.intent && <div className="text-xs text-emerald-700 mt-0.5">→ {h.intent}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
