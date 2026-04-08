"use client";
import { useState, useEffect, useCallback } from "react";

export default function TashrifPage() {
  const [tashriflar, setTashriflar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [klientId, setKlientId] = useState("");
  const [tab, setTab] = useState("tarix");

  const API = process.env.NEXT_PUBLIC_API_URL || "/api";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}` };

  useEffect(() => {
    fetch(`${API}/tashrif/tarix?limit=100`, { headers })
      .then(r => r.json()).then(setTashriflar).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const doCheckin = useCallback(async () => {
    if (!klientId) return;
    setCheckinLoading(true);
    try {
      let lat = null, lon = null, acc = null;
      if (navigator.geolocation) {
        const pos: any = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
        ).catch(() => null);
        if (pos) {
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          acc = pos.coords.accuracy;
        }
      }

      const res = await fetch(`${API}/tashrif/checkin`, {
        method: "POST", headers,
        body: JSON.stringify({ klient_id: parseInt(klientId), latitude: lat, longitude: lon, accuracy: acc }),
      });
      const data = await res.json();
      if (data.id) {
        setTashriflar(p => [{ ...data, klient_id: parseInt(klientId), turi: "checkin", klient_nomi: `Klient #${klientId}` }, ...p]);
        setKlientId("");
      } else {
        alert(data.xato || "Xatolik");
      }
    } finally { setCheckinLoading(false); }
  }, [klientId, API]);

  const doCheckout = useCallback(async (kid: any) => {
    const res = await fetch(`${API}/tashrif/checkout`, {
      method: "POST", headers,
      body: JSON.stringify({ klient_id: kid }),
    });
    const data = await res.json();
    if (data.id) {
      setTashriflar(p => [{ ...data, klient_id: kid, turi: "checkout", klient_nomi: `Klient #${kid}` }, ...p]);
    }
  }, [API]);

  // Ochiq check-inlar (checkout qilinmaganlar)
  const ochiq = tashriflar.filter((t: any) => {
    if (t.turi !== "checkin") return false;
    return !tashriflar.some((t2: any) => t2.turi === "checkout" && t2.klient_id === t.klient_id && t2.vaqt > t.vaqt);
  });

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-1">📍 Tashriflar</h1>
      <p className="text-sm text-gray-500 mb-6">Check-in/out va tashrif boshqaruvi</p>

      {/* Check-in formasi */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 mb-6">
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={klientId}
            onChange={e => setKlientId(e.target.value)}
            placeholder="Klient ID kiriting"
            className="flex-1 px-3 py-2.5 border rounded-lg text-sm"
          />
          <button
            onClick={doCheckin}
            disabled={checkinLoading || !klientId}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {checkinLoading ? "..." : "📍 Check-in"}
          </button>
        </div>
      </div>

      {/* Ochiq check-inlar */}
      {ochiq.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🟢 Ochiq tashriflar</h3>
          <div className="space-y-2">
            {ochiq.map((t: any) => (
              <div key={t.id || t.vaqt} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div>
                  <span className="font-medium text-sm">{t.klient_nomi || `Klient #${t.klient_id}`}</span>
                  <span className="text-xs text-gray-500 ml-2">{t.vaqt ? new Date(t.vaqt).toLocaleTimeString("uz") : ""}</span>
                </div>
                <button onClick={() => doCheckout(t.klient_id)}
                  className="px-3 py-1.5 bg-orange-500 text-white rounded text-xs font-medium hover:bg-orange-600">
                  Check-out →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarix */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold">Tashrif tarixi</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {tashriflar.slice(0, 50).map((t: any, i: number) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`text-lg ${t.turi === "checkin" ? "" : ""}`}>
                  {t.turi === "checkin" ? "📍" : "🏁"}
                </span>
                <div>
                  <div className="text-sm font-medium">{t.klient_nomi || `Klient #${t.klient_id}`}</div>
                  <div className="text-xs text-gray-500">
                    {t.turi === "checkin" ? "Kirish" : "Chiqish"}
                    {t.latitude ? ` • ${t.latitude.toFixed(4)}, ${t.longitude.toFixed(4)}` : ""}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400">{t.vaqt ? new Date(t.vaqt).toLocaleString("uz") : ""}</span>
            </div>
          ))}
          {tashriflar.length === 0 && <div className="text-center py-12 text-gray-400">Tashriflar yo&apos;q</div>}
        </div>
      </div>
    </div>
  );
}
