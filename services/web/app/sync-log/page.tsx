"use client";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

export default function SyncLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    fetch(`${API}/config/sync-log?limit=100`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
    }).then(r => r.json()).then(setLogs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const success = logs.filter((l: any) => l.muvaffaqiyatli).length;
  const fail = logs.filter((l: any) => !l.muvaffaqiyatli).length;

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" /></div>;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <PageHeader
          icon={RefreshCw}
          gradient="blue"
          title="Sinxronizatsiya jurnal"
          subtitle="Sinxronizatsiya tarixi va xatolar"
        />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold">{logs.length}</div>
          <div className="text-xs text-muted-foreground">Jami sync</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{success}</div>
          <div className="text-xs text-emerald-600">Muvaffaqiyatli</div>
        </div>
        <div className="bg-rose-500/10 dark:bg-rose-950/20 rounded-xl border border-rose-500/30 dark:border-rose-800 p-4 text-center">
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{fail}</div>
          <div className="text-xs text-rose-600 dark:text-rose-400">Xatolik</div>
        </div>
      </div>

      <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 dark:bg-muted text-left">
              <th className="px-4 py-3 font-medium">Vaqt</th>
              <th className="px-4 py-3 font-medium">Turi</th>
              <th className="px-4 py-3 font-medium">Entitylar</th>
              <th className="px-4 py-3 font-medium">Hajmi</th>
              <th className="px-4 py-3 font-medium">Holat</th>
              <th className="px-4 py-3 font-medium">Xato</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l: any) => (
              <tr key={l.id} className="border-t border-border/60 dark:border-border hover:bg-muted/50 dark:hover:bg-muted/50">
                <td className="px-4 py-3 text-xs">{l.boshlangan ? new Date(l.boshlangan).toLocaleString("uz") : "—"}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${l.sync_turi === "auto" ? "bg-blue-500/15 text-blue-700" : "bg-muted text-foreground"}`}>{l.sync_turi}</span></td>
                <td className="px-4 py-3">{l.entity_soni || 0}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{l.yuborilgan_bayt ? `↑${(l.yuborilgan_bayt/1024).toFixed(1)}KB` : ""} {l.qabul_qilingan_bayt ? `↓${(l.qabul_qilingan_bayt/1024).toFixed(1)}KB` : ""}</td>
                <td className="px-4 py-3">{l.muvaffaqiyatli ? <span className="text-emerald-500">✓</span> : <span className="text-rose-500 dark:text-rose-400">✗ {l.status_kod}</span>}</td>
                <td className="px-4 py-3 text-xs text-rose-500 dark:text-rose-400 max-w-48 truncate">{l.xato_xabar || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="text-center py-12 text-muted-foreground">Sync loglar yo&apos;q</div>}
      </div>
    </div>
  );
}
