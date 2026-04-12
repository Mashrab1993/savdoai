"use client";
import { useState, useEffect, type ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header"

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-card rounded-xl border border-border dark:border-border p-4 ${className}`}>{children}</div>;
}
function Stat({ label, value, icon, trend, color = "emerald" }: { label: string; value: string | number; icon: string; trend?: number; color?: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
      {trend !== undefined && (
        <div className={`text-xs mt-1 ${trend >= 0 ? "text-emerald-500" : "text-red-500"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% haftalik
        </div>
      )}
    </Card>
  );
}

export default function AIDashboard() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [insights, setInsights] = useState<Array<Record<string, any>>>([]);
  const [config, setConfig] = useState<Record<string, Record<string, boolean>> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<string>("umumiy");

  const API = process.env.NEXT_PUBLIC_API_URL || "";
  const h = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/hisobot/umumiy`, { headers: h }).then(r => r.ok ? r.json() : {}),
      fetch(`${API}/tahlil`, { headers: h }).then(r => r.ok ? r.json() : { insightlar: [] }),
      fetch(`${API}/config`, { headers: h }).then(r => r.ok ? r.json() : null),
    ]).then(([d, ins, cfg]) => {
      setData(d);
      setInsights(ins.insightlar || ins || []);
      setConfig(cfg);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto mb-3" />
        <div className="text-sm text-muted-foreground">AI tahlil qilmoqda...</div>
      </div>
    </div>
  );

  const bugun = data?.bugun || {};
  const hafta = data?.hafta || {};
  const oy = data?.oy || {};

  const tabs = [
    { id: "umumiy", label: "📊 Umumiy", icon: "📊" },
    { id: "insights", label: "🧠 AI Insights", icon: "🧠" },
    { id: "config", label: "⚙️ Tizim holati", icon: "⚙️" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-white">🧠 AI Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time biznes tahlili va AI tavsiyalar</p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted/50 dark:bg-muted px-3 py-1.5 rounded-full">
          Yangilangan: {new Date().toLocaleTimeString("uz")}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id ? "bg-emerald-600 text-white" : "bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground"
            }`}>{t.label}</button>
        ))}
      </div>

      {/* UMUMIY TAB */}
      {tab === "umumiy" && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Stat label="Bugungi sotuv" value={bugun.jami_sotuv || "0"} icon="💰" trend={bugun.trend} />
            <Stat label="Buyurtmalar" value={bugun.soni || "0"} icon="📦" />
            <Stat label="Yangi klientlar" value={bugun.yangi_klient || "0"} icon="👤" color="blue" />
            <Stat label="Yig'ilgan qarz" value={bugun.qarz_yigildi || "0"} icon="💳" color="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Haftalik sotuv */}
            <Card>
              <h3 className="text-sm font-semibold mb-3">📈 Haftalik sotuv trendi</h3>
              <div className="space-y-2">
                {(hafta.kunlik || []).map((k: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-8">{k.kun}</span>
                    <div className="flex-1 bg-muted dark:bg-muted rounded-full h-5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (k.summa / (hafta.max || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium w-20 text-right">{k.summa_fmt || k.summa}</span>
                  </div>
                ))}
                {!(hafta.kunlik?.length) && <div className="text-sm text-muted-foreground py-4 text-center">Ma&apos;lumot yo&apos;q</div>}
              </div>
            </Card>

            {/* Top tovarlar */}
            <Card>
              <h3 className="text-sm font-semibold mb-3">🏆 Top 5 tovar (bu oy)</h3>
              <div className="space-y-2">
                {(oy.top_tovarlar || []).slice(0, 5).map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                      <span className="text-sm">{t.nomi}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{t.summa_fmt || t.summa}</div>
                      <div className="text-xs text-muted-foreground">{t.miqdor} dona</div>
                    </div>
                  </div>
                ))}
                {!(oy.top_tovarlar?.length) && <div className="text-sm text-muted-foreground py-4 text-center">Ma&apos;lumot yo&apos;q</div>}
              </div>
            </Card>
          </div>

          {/* Top klientlar */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold mb-3">👥 Top klientlar (bu oy)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(oy.top_klientlar || []).slice(0, 6).map((k: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-600">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{(k.nom || k.ism || "") || k.ism || k.klient_nomi || k.klient_ismi}</div>
                    <div className="text-xs text-muted-foreground">{k.sotuv_soni} ta sotuv</div>
                  </div>
                  <div className="text-sm font-bold text-emerald-600">{k.summa_fmt || k.summa}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* AI INSIGHTS TAB */}
      {tab === "insights" && (
        <div className="space-y-3">
          {insights.length === 0 && (
            <Card className="text-center py-12">
              <div className="text-4xl mb-3">🧠</div>
              <div className="text-lg font-semibold mb-1">AI tahlil</div>
              <div className="text-sm text-muted-foreground">Yetarli ma&apos;lumot to&apos;planganda AI tavsiyalar paydo bo&apos;ladi</div>
            </Card>
          )}
          {insights.map((ins, i) => (
            <Card key={i} className={`border-l-4 ${
              ins.turi === "xavf" ? "border-l-red-500" :
              ins.turi === "imkoniyat" ? "border-l-emerald-500" :
              ins.turi === "anomaliya" ? "border-l-amber-500" : "border-l-blue-500"
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{ins.emoji || "💡"}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{ins.sarlavha}</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">{ins.tavsif}</div>
                  {ins.tavsiya && (
                    <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      💡 {ins.tavsiya}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CONFIG/TIZIM TAB */}
      {tab === "config" && config && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { modul: "buyurtma", icon: "📦", label: "Buyurtma" },
            { modul: "klient", icon: "👤", label: "Klient" },
            { modul: "gps", icon: "📍", label: "GPS" },
            { modul: "aksiya", icon: "🎁", label: "Aksiya" },
            { modul: "printer", icon: "🖨️", label: "Printer" },
            { modul: "ombor", icon: "🏭", label: "Ombor" },
            { modul: "sync", icon: "🔄", label: "Sync" },
            { modul: "notifikatsiya", icon: "🔔", label: "Bildirishnoma" },
          ].map(m => {
            const modulConfig = config[m.modul] || {};
            const yoqilgan = Object.values(modulConfig).filter(v => v === true).length;
            const jami = Object.keys(modulConfig).length;
            return (
              <Card key={m.modul}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{m.icon}</span>
                    <span className="text-sm font-semibold">{m.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{yoqilgan}/{jami} faol</span>
                </div>
                <div className="mt-2 bg-muted dark:bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${jami > 0 ? (yoqilgan / jami) * 100 : 0}%` }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
