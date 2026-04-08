"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function Card({ children, className = "" }) {
  return <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 ${className}`}>{children}</div>;
}

export default function Klient360Page() {
  const [klientId, setKlientId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const API = process.env.NEXT_PUBLIC_API_URL || "/api";
  const h = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}` };

  useEffect(() => {
    const id = searchParams?.get("id");
    if (id) { setKlientId(id); yukla(id); }
  }, [searchParams]);

  const yukla = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/klient360/${id}`, { headers: h });
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const p = data?.profil || {};
  const m = data?.moliya || {};
  const seg = data?.segment || {};

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">👤 Klient 360°</h1>
        <p className="text-sm text-gray-500 mt-1">To&apos;liq klient profili — HubSpot darajasida</p>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <input type="number" value={klientId} onChange={e => setKlientId(e.target.value)}
          placeholder="Klient ID" className="flex-1 px-4 py-2.5 border rounded-xl text-sm" />
        <button onClick={() => yukla(klientId)} disabled={!klientId || loading}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
          {loading ? "..." : "Ko'rish"}
        </button>
      </div>

      {data?.xato && <Card className="p-6 text-center text-red-500">{data.xato}</Card>}

      {data && !data.xato && (
        <div className="space-y-4">
          {/* Header Card */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">{(p.nom || "?")[0]}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{p.nom}</h2>
                  <div className="text-sm text-gray-500">{p.telefon} • {p.manzil}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Klient #{p.id} • {p.kunlar_bilan} kun bilan</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl">{seg.emoji}</div>
                <div className="text-xs font-bold mt-1" style={{ color: seg.rang }}>{seg.nomi}</div>
              </div>
            </div>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Jami xarid", value: Number(m.jami_xarid || 0).toLocaleString(), icon: "💰" },
              { label: "Sotuv soni", value: m.sotuv_soni, icon: "📦" },
              { label: "O'rtacha chek", value: Number(m.ortacha_chek || 0).toLocaleString(), icon: "📊" },
              { label: "Joriy qarz", value: Number(m.joriy_qarz || 0).toLocaleString(), icon: "💳", danger: Number(m.joriy_qarz || 0) > 0 },
              { label: "CLV (1 yil)", value: Number(data.clv?.yillik_prognoz || 0).toLocaleString(), icon: "🎯" },
            ].map((s, i) => (
              <Card key={i} className={`p-3 text-center ${s.danger ? "border-red-300 bg-red-50 dark:bg-red-900/10" : ""}`}>
                <div className="text-lg">{s.icon}</div>
                <div className={`text-lg font-bold ${s.danger ? "text-red-600" : ""}`}>{s.value}</div>
                <div className="text-[10px] text-gray-500">{s.label}</div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top tovarlar */}
            <Card>
              <div className="p-4 border-b"><h3 className="text-sm font-semibold">🏆 Top tovarlar</h3></div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {(data.top_tovarlar || []).map((t, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-5">{i+1}.</span>
                      <span className="text-sm">{t.tovar_nomi}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{Number(t.summa).toLocaleString()}</span>
                      <span className="text-xs text-gray-400 ml-1">({t.miqdor}x)</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cross-sell */}
            <Card>
              <div className="p-4 border-b"><h3 className="text-sm font-semibold">🎯 Cross-sell tavsiyalar</h3></div>
              <div className="p-4 space-y-2">
                {(data.cross_sell || []).map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                    <div>
                      <div className="text-sm font-medium">{c.nomi}</div>
                      <div className="text-xs text-emerald-600">{c.necha_klient} o&apos;xshash klient olgan</div>
                    </div>
                    <div className="text-sm font-bold">{Number(c.narx).toLocaleString()}</div>
                  </div>
                ))}
                {(!data.cross_sell?.length) && <div className="text-sm text-gray-400 text-center py-4">Tavsiya yo&apos;q</div>}
              </div>
            </Card>
          </div>

          {/* Hafta kunlari + Narx sezgirligi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <div className="p-4 border-b"><h3 className="text-sm font-semibold">📅 Sotuv kunlari</h3></div>
              <div className="p-4 space-y-2">
                {(data.hafta_kunlari || []).map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-8">{h.kun}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, h.soni * 10)}%` }} />
                    </div>
                    <span className="text-xs font-medium w-6 text-right">{h.soni}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">💡 Narx sezgirligi</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Chegirmali sotuvlar</span>
                  <span className="font-bold">{data.narx_sezgirligi?.chegirmali_sotuv || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Chegirmasiz sotuvlar</span>
                  <span className="font-bold">{data.narx_sezgirligi?.chegirmasiz_sotuv || 0}</span>
                </div>
                <div className={`p-3 rounded-lg text-center text-sm font-medium ${
                  data.narx_sezgirligi?.chegirmaga_sezgir
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {data.narx_sezgirligi?.chegirmaga_sezgir
                    ? "⚠️ Chegirmaga SEZGIR — chegirma bersangiz ko'proq sotib oladi"
                    : "✅ Chegirmaga sezgir emas — odatiy narxda sotib oladi"}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
