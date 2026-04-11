"use client";
import { useState, useEffect } from "react";

const TURLAR: Record<string, { label: string; icon: string }> = {
  foiz_chegirma: { label: "Foiz chegirma", icon: "%" },
  summa_chegirma: { label: "Summa chegirma", icon: "💰" },
  tovar_hadya: { label: "Tovar hadya (N+M)", icon: "🎁" },
  bonus_ball: { label: "Bonus ball", icon: "⭐" },
  narx_tushirish: { label: "Maxsus narx", icon: "📉" },
  min_summa: { label: "Min summa chegirma", icon: "📊" },
};

export default function AksiyaPage() {
  const [aksiyalar, setAksiyalar] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nomi: "", turi: "foiz_chegirma", chegirma_foiz: 0, chegirma_summa: 0,
    min_summa: 0, hadya_shart_miqdor: 0, hadya_bepul_miqdor: 0,
    barcha_tovarlar: true, barcha_klientlar: true, prioritet: 0,
  });

  const API = process.env.NEXT_PUBLIC_API_URL || "";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` };

  useEffect(() => {
    fetch(`${API}/aksiya`, { headers }).then(r => r.json()).then(setAksiyalar).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const res = await fetch(`${API}/aksiya`, { method: "POST", headers, body: JSON.stringify(form) });
    if (res.ok) { const d = await res.json(); setAksiyalar(p => [{ id: d.id, ...form, faol: true }, ...p]); setShowForm(false); }
  };

  const toggle = async (id: any, faol: any) => {
    await fetch(`${API}/aksiya/${id}/holat?faol=${!faol}`, { method: "PUT", headers });
    setAksiyalar(p => p.map((a: any) => a.id === id ? { ...a, faol: !faol } : a));
  };

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">🎁 Aksiyalar</h1>
          <p className="text-sm text-gray-500 mt-1">Chegirmalar va aksiyalarni boshqaring</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          {showForm ? "Bekor qilish" : "+ Yangi aksiya"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-5 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nomi</label>
              <input value={form.nomi} onChange={e => setForm(p => ({ ...p, nomi: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="Aksiya nomi" />
            </div>
            <div>
              <label className="text-sm font-medium">Turi</label>
              <select value={form.turi} onChange={e => setForm(p => ({ ...p, turi: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                {Object.entries(TURLAR).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
          </div>

          {(form.turi === "foiz_chegirma" || form.turi === "min_summa") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Chegirma foizi (%)</label>
                <input type="number" value={form.chegirma_foiz} onChange={e => setForm(p => ({ ...p, chegirma_foiz: +e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Minimal summa</label>
                <input type="number" value={form.min_summa} onChange={e => setForm(p => ({ ...p, min_summa: +e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
          )}

          {form.turi === "summa_chegirma" && (
            <div>
              <label className="text-sm font-medium">Chegirma summasi (so&apos;m)</label>
              <input type="number" value={form.chegirma_summa} onChange={e => setForm(p => ({ ...p, chegirma_summa: +e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
          )}

          {form.turi === "tovar_hadya" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Necha dona olganda</label>
                <input type="number" value={form.hadya_shart_miqdor} onChange={e => setForm(p => ({ ...p, hadya_shart_miqdor: +e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Necha dona bepul</label>
                <input type="number" value={form.hadya_bepul_miqdor} onChange={e => setForm(p => ({ ...p, hadya_bepul_miqdor: +e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
          )}

          <button onClick={save} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">Saqlash</button>
        </div>
      )}

      <div className="space-y-3">
        {aksiyalar.map((a: any) => (
          <div key={a.id} className={`flex items-center justify-between p-4 rounded-xl border ${a.faol ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-950 opacity-60"}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{TURLAR[a.turi]?.icon || "📋"}</span>
              <div>
                <div className="font-medium">{a.nomi}</div>
                <div className="text-xs text-gray-500">{TURLAR[a.turi]?.label} {a.chegirma_foiz > 0 ? `• ${a.chegirma_foiz}%` : ""} {a.min_summa > 0 ? `• min ${a.min_summa}` : ""}</div>
              </div>
            </div>
            <button onClick={() => toggle(a.id, a.faol)}
              className={`w-11 h-6 rounded-full transition-colors relative ${a.faol ? "bg-emerald-500" : "bg-gray-300"}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${a.faol ? "translate-x-5" : ""}`} />
            </button>
          </div>
        ))}
        {aksiyalar.length === 0 && <div className="text-center py-12 text-gray-400">Hali aksiyalar yo&apos;q</div>}
      </div>
    </div>
  );
}
