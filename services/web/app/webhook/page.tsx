"use client";
import { useState, useEffect } from "react";
import { Link } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const EVENT_ICONS: Record<string, string> = {
  "sotuv.yaratildi": "💰", "sotuv.bekor_qilindi": "↩️", "sotuv.tasdiqlandi": "✅",
  "klient.yaratildi": "👤", "klient.yangilandi": "✏️",
  "qarz.yaratildi": "💳", "qarz.tolandi": "💚",
  "qoldiq.tugadi": "🔴", "qoldiq.kam": "🟡",
  "tolov.qabul_qilindi": "💵", "hisobot.kunlik": "📊", "hisobot.haftalik": "📈",
  "aksiya.boshlandi": "🎁", "checkin.yaratildi": "📍",
};

export default function WebhookPage() {
  const [webhooklar, setWebhooklar] = useState<any[]>([]);
  const [eventlar, setEventlar] = useState<Record<string, any>>({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ nomi: string; url: string; eventlar: string[] }>({ nomi: "", url: "", eventlar: [] });

  const API = process.env.NEXT_PUBLIC_API_URL || "";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/webhook`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/webhook/eventlar`, { headers }).then(r => r.ok ? r.json() : {}),
    ]).then(([wh, ev]) => { setWebhooklar(wh); setEventlar(ev); }).finally(() => setLoading(false));
  }, []);

  const toggleEvent = (e: string) => {
    setForm(p => ({
      ...p,
      eventlar: p.eventlar.includes(e) ? p.eventlar.filter((x: string) => x !== e) : [...p.eventlar, e]
    }));
  };

  const save = async () => {
    const res = await fetch(`${API}/webhook`, { method: "POST", headers, body: JSON.stringify(form) });
    if (res.ok) {
      const d = await res.json();
      setWebhooklar(p => [{ id: d.id, ...form, faol: true, muvaffaqiyatli_soni: 0, xato_soni: 0 }, ...p]);
      setShowForm(false);
      setForm({ nomi: "", url: "", eventlar: [] });
    }
  };

  const test = async (id: any) => {
    await fetch(`${API}/webhook/test/${id}`, { method: "POST", headers });
    alert("Test yuborildi!");
  };

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <PageHeader
          icon={Link}
          gradient="blue"
          title="Webhook"
          subtitle="Tashqi tizimlar bilan bog'lanish (1C, Telegram, Google Sheets...)"
        />
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          {showForm ? "Bekor" : "+ Yangi webhook"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border p-5 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nomi</label>
              <input value={form.nomi} onChange={e => setForm(p => ({ ...p, nomi: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="Masalan: 1C Integratsiya" />
            </div>
            <div>
              <label className="text-sm font-medium">URL</label>
              <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="https://example.com/webhook" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Eventlar tanlang</label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(eventlar).map(([key, label]: [string, any]) => (
                <button key={key} onClick={() => toggleEvent(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all ${
                    form.eventlar.includes(key) ? "bg-emerald-50 border-emerald-300 border text-emerald-700" : "bg-muted/50 dark:bg-muted border border-transparent text-muted-foreground"
                  }`}>
                  <span>{EVENT_ICONS[key] || "📌"}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={save} disabled={!form.nomi || !form.url || form.eventlar.length === 0}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            Saqlash
          </button>
        </div>
      )}

      <div className="space-y-3">
        {webhooklar.map((w: any) => (
          <div key={w.id} className="bg-card rounded-xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium text-sm">{w.nomi}</div>
                <div className="text-xs text-muted-foreground font-mono">{w.url}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => test(w.id)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Test</button>
                <span className={`w-2.5 h-2.5 rounded-full ${w.faol ? "bg-emerald-500" : "bg-gray-300"}`} />
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>✅ {w.muvaffaqiyatli_soni || 0} muvaffaqiyatli</span>
              <span>❌ {w.xato_soni || 0} xato</span>
              <span>📌 {(w.eventlar || []).length} event</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(w.eventlar || []).map((e: any) => (
                <span key={e} className="px-2 py-0.5 bg-muted dark:bg-muted rounded text-[10px]">
                  {EVENT_ICONS[e] || "📌"} {e}
                </span>
              ))}
            </div>
          </div>
        ))}
        {webhooklar.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">🔗</div>
            <div className="text-sm">Hali webhook yo&apos;q — tashqi tizimlar bilan bog&apos;laning!</div>
          </div>
        )}
      </div>
    </div>
  );
}
