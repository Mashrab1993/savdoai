"use client";
import { useState, useEffect } from "react";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 ${className}`}>{children}</div>;
}

export default function AnalytikaPage() {
  const [tab, setTab] = useState("abc");
  const [abc, setAbc] = useState<any>(null);
  const [churn, setChurn] = useState<any>(null);
  const [reorder, setReorder] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL || "";
  const h = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` };

  useEffect(() => {
    setLoading(true);
    const ep = tab === "abc" ? "/analitika/abc-xyz"
             : tab === "churn" ? "/analitika/churn"
             : tab === "reorder" ? "/analitika/abc-xyz/avtobuyurtma"
             : "/analitika/cohort";
    fetch(`${API}${ep}`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (tab === "abc") setAbc(d);
        else if (tab === "churn") setChurn(d);
        else if (tab === "reorder") setReorder(d || []);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [tab]);

  const tabs = [
    { id: "abc", label: "📊 ABC-XYZ Matritsa", desc: "Tovar ahamiyat tahlili" },
    { id: "churn", label: "⚠️ Churn Prognoz", desc: "Klient ketish xavfi" },
    { id: "reorder", label: "📦 Auto Buyurtma", desc: "Qachon qayta buyurtma?" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">📊 Pro Analitika</h1>
        <p className="text-sm text-gray-500 mt-1">SAP/Oracle darajasidagi biznes tahlili</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((t: any) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}>{t.label}</button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center p-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3" />
            <div className="text-sm text-gray-500">Tahlil qilmoqda...</div>
          </div>
        </div>
      )}

      {/* ═══ ABC-XYZ MATRITSA ═══ */}
      {!loading && tab === "abc" && abc && (
        <>
          {/* Matritsa grid */}
          <div className="grid grid-cols-4 gap-1 mb-6">
            <div className="p-2 text-center text-xs font-bold text-gray-400" />
            {["X (Barqaror)", "Y (Mavsumiy)", "Z (Tartibsiz)"].map((x: string) => (
              <div key={x} className="p-2 text-center text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800 rounded">{x}</div>
            ))}
            {["A (Top 80%)", "B (O'rta 15%)", "C (Quyi 5%)"].map((a: string, ai: number) => (
              <>
                <div key={a} className="p-2 text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800 rounded flex items-center">{a}</div>
                {["X", "Y", "Z"].map((x: string) => {
                  const key = `${["A","B","C"][ai]}${x}` as string;
                  const count = abc.matritsa_statistika?.[key] || 0;
                  const colors: Record<string, string> = { AX: "bg-emerald-100 text-emerald-700 border-emerald-300",
                                   AY: "bg-amber-50 text-amber-700 border-amber-300",
                                   AZ: "bg-red-50 text-red-700 border-red-300",
                                   BX: "bg-emerald-50 text-emerald-600 border-emerald-200",
                                   BY: "bg-gray-50 text-gray-600 border-gray-300",
                                   BZ: "bg-amber-50 text-amber-600 border-amber-200",
                                   CX: "bg-blue-50 text-blue-600 border-blue-200",
                                   CY: "bg-gray-50 text-gray-500 border-gray-200",
                                   CZ: "bg-red-50 text-red-600 border-red-200" };
                  return (
                    <div key={key} className={`p-3 rounded border text-center ${colors[key] || "bg-gray-50"}`}>
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-[10px]">{key}</div>
                    </div>
                  );
                })}
              </>
            ))}
          </div>

          {/* Tovarlar ro'yxati */}
          <Card>
            <div className="p-4 border-b"><h3 className="text-sm font-semibold">Tovarlar tahlili ({abc.tovarlar?.length || 0} ta)</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 text-left text-xs">
                    <th className="px-4 py-2">Tovar</th>
                    <th className="px-4 py-2">Matritsa</th>
                    <th className="px-4 py-2">Summa</th>
                    <th className="px-4 py-2">Daromad %</th>
                    <th className="px-4 py-2">CV</th>
                    <th className="px-4 py-2">Tavsiya</th>
                  </tr>
                </thead>
                <tbody>
                  {(abc.tovarlar || []).slice(0, 30).map((t: any, i: number) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-2.5 font-medium">{t.nomi}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: t.rang + "20", color: t.rang }}>
                          {t.emoji} {t.matritsa}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{Number(t.jami_summa).toLocaleString()}</td>
                      <td className="px-4 py-2.5">{t.daromad_foizi}%</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{t.cv}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 max-w-48 truncate">{t.tavsiya}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ═══ CHURN PREDICTION ═══ */}
      {!loading && tab === "churn" && churn && (
        <>
          {/* Xulosa cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Card className="p-4 text-center"><div className="text-2xl font-bold">{churn.xulosa?.jami_klient || 0}</div><div className="text-xs text-gray-500">Jami klient</div></Card>
            <Card className="p-4 text-center border-red-200 bg-red-50 dark:bg-red-900/20"><div className="text-2xl font-bold text-red-600">{churn.xulosa?.kritik_xavf || 0}</div><div className="text-xs text-red-600">Kritik xavf 🔴</div></Card>
            <Card className="p-4 text-center border-amber-200 bg-amber-50 dark:bg-amber-900/20"><div className="text-2xl font-bold text-amber-600">{churn.xulosa?.yuqori_xavf || 0}</div><div className="text-xs text-amber-600">Yuqori xavf 🟠</div></Card>
            <Card className="p-4 text-center border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20"><div className="text-2xl font-bold text-emerald-600">{churn.xulosa?.xavfsiz || 0}</div><div className="text-xs text-emerald-600">Xavfsiz 🟢</div></Card>
          </div>

          {/* Klientlar ro'yxati */}
          <div className="space-y-2">
            {(churn.klientlar || []).slice(0, 20).map((k: any, i: number) => (
              <Card key={i} className={`p-4 border-l-4 ${
                k.daraja === "kritik" ? "border-l-red-500" :
                k.daraja === "yuqori" ? "border-l-orange-500" :
                k.daraja === "o'rta" ? "border-l-amber-500" : "border-l-emerald-500"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{k.emoji}</span>
                    <div>
                      <div className="font-semibold text-sm">{k.nom}</div>
                      <div className="text-xs text-gray-500">{k.telefon}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{
                      color: k.risk_skor >= 80 ? "#dc2626" : k.risk_skor >= 60 ? "#ea580c" : k.risk_skor >= 40 ? "#d97706" : "#059669"
                    }}>{k.risk_skor}%</div>
                    <div className="text-[10px] text-gray-400">risk skor</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">{k.harakat}</div>
                <div className="mt-1 text-xs text-emerald-600">💡 {k.tavsiya}</div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ═══ AUTO REORDER ═══ */}
      {!loading && tab === "reorder" && (
        <Card>
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold">📦 Qayta buyurtma kerak bo&apos;lgan tovarlar</h3>
            <p className="text-xs text-gray-500 mt-0.5">Reorder Point algoritmi asosida</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(reorder || []).map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{t.emoji}</span>
                  <div>
                    <div className="text-sm font-medium">{t.nomi}</div>
                    <div className="text-xs text-gray-500">
                      Matritsa: <span className="font-bold">{t.matritsa}</span> • Qoldiq: {t.qoldiq} • Kunlik sotuv: {t.kunlik_sotuv}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600">{t.buyurtma_miqdor} dona</div>
                  <div className="text-[10px] text-gray-400">{t.kunlar_qoldi} kun qoldi</div>
                </div>
              </div>
            ))}
            {(!reorder || reorder.length === 0) && (
              <div className="text-center py-12 text-gray-400">Hozircha qayta buyurtma kerak emas</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
