"use client";
import { useState, useEffect } from "react";

export default function SyncLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL || "/api";

  useEffect(() => {
    fetch(`${API}/config/sync-log?limit=100`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then(r => r.json()).then(setLogs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const success = logs.filter(l => l.muvaffaqiyatli).length;
  const fail = logs.filter(l => !l.muvaffaqiyatli).length;

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" /></div>;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-1">🔄 Sync loglar</h1>
      <p className="text-sm text-gray-500 mb-6">Sinxronizatsiya tarixi va xatolar</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold">{logs.length}</div>
          <div className="text-xs text-gray-500">Jami sync</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{success}</div>
          <div className="text-xs text-emerald-600">Muvaffaqiyatli</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{fail}</div>
          <div className="text-xs text-red-600">Xatolik</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left">
              <th className="px-4 py-3 font-medium">Vaqt</th>
              <th className="px-4 py-3 font-medium">Turi</th>
              <th className="px-4 py-3 font-medium">Entitylar</th>
              <th className="px-4 py-3 font-medium">Hajmi</th>
              <th className="px-4 py-3 font-medium">Holat</th>
              <th className="px-4 py-3 font-medium">Xato</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 text-xs">{l.boshlangan ? new Date(l.boshlangan).toLocaleString("uz") : "—"}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${l.sync_turi === "auto" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{l.sync_turi}</span></td>
                <td className="px-4 py-3">{l.entity_soni || 0}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{l.yuborilgan_bayt ? `↑${(l.yuborilgan_bayt/1024).toFixed(1)}KB` : ""} {l.qabul_qilingan_bayt ? `↓${(l.qabul_qilingan_bayt/1024).toFixed(1)}KB` : ""}</td>
                <td className="px-4 py-3">{l.muvaffaqiyatli ? <span className="text-emerald-500">✓</span> : <span className="text-red-500">✗ {l.status_kod}</span>}</td>
                <td className="px-4 py-3 text-xs text-red-500 max-w-48 truncate">{l.xato_xabar || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="text-center py-12 text-gray-400">Sync loglar yo&apos;q</div>}
      </div>
    </div>
  );
}
