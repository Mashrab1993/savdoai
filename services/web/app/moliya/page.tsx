"use client";
import { useState, useEffect } from "react";

function Card({ children, className = "" }) {
  return <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 ${className}`}>{children}</div>;
}
function Row({ label, value, bold = false, indent = 0, color = "" }) {
  return (
    <div className={`flex justify-between py-2 px-4 ${bold ? "font-bold border-t-2 border-gray-200 dark:border-gray-700" : "border-b border-gray-50 dark:border-gray-800"}`}
      style={{ paddingLeft: `${16 + indent * 16}px` }}>
      <span className={`text-sm ${color || (bold ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400")}`}>{label}</span>
      <span className={`text-sm font-mono ${color || ""}`}>{typeof value === "number" ? value.toLocaleString() : value}</span>
    </div>
  );
}

export default function MoliyaPage() {
  const [tab, setTab] = useState("pl");
  const [pl, setPl] = useState(null);
  const [bs, setBs] = useState(null);
  const [cf, setCf] = useState(null);
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL || "/api";
  const h = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}` };

  useEffect(() => {
    setLoading(true);
    const ep = tab === "pl" ? "/moliya/foyda-zarar"
             : tab === "bs" ? "/moliya/balans"
             : tab === "cf" ? "/moliya/pul-oqimi"
             : "/moliya/koeffitsientlar";
    fetch(`${API}${ep}`, { headers: h }).then(r => r.ok ? r.json() : null).then(d => {
      if (tab === "pl") setPl(d);
      else if (tab === "bs") setBs(d);
      else if (tab === "cf") setCf(d);
      else setKpi(d);
    }).finally(() => setLoading(false));
  }, [tab]);

  const tabs = [
    { id: "pl", label: "📊 Foyda/Zarar" },
    { id: "bs", label: "⚖️ Balans" },
    { id: "cf", label: "💧 Pul oqimi" },
    { id: "kpi", label: "📈 KPI" },
  ];

  const N = (v) => Number(v || 0);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">💼 Moliyaviy hisobotlar</h1>
        <p className="text-sm text-gray-500 mt-1">QuickBooks darajasida — avtomatik P&L, Balans, Cash Flow</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              tab === t.id ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600"
            }`}>{t.label}</button>
        ))}
      </div>

      {loading && <div className="flex justify-center p-16"><div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full" /></div>}

      {/* P&L */}
      {!loading && tab === "pl" && pl && (
        <Card>
          <div className="p-4 border-b bg-blue-50 dark:bg-blue-900/10 rounded-t-xl">
            <h2 className="font-bold">📊 Foyda va Zarar hisoboti</h2>
            <p className="text-xs text-gray-500">{pl.davr?.dan} — {pl.davr?.gacha}</p>
          </div>
          <Row label="Jami sotuv" value={N(pl.daromad?.jami_sotuv).toLocaleString()} />
          <Row label="Qaytarishlar" value={`-${N(pl.daromad?.qaytarish).toLocaleString()}`} indent={1} color="text-red-500" />
          <Row label="Chegirmalar" value={`-${N(pl.daromad?.chegirma).toLocaleString()}`} indent={1} color="text-red-500" />
          <Row label="SOF SOTUV" value={N(pl.daromad?.sof_sotuv).toLocaleString()} bold />
          <Row label="Tannarx (COGS)" value={`-${N(pl.tannarx?.jami).toLocaleString()}`} color="text-red-500" />
          <Row label="YALPI FOYDA" value={N(pl.yalpi_foyda?.summa).toLocaleString()} bold />
          <Row label={`Margin: ${pl.yalpi_foyda?.margin_foiz}%`} value="" indent={1} color="text-blue-500" />
          <div className="px-4 py-1 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500">XARAJATLAR</div>
          {pl.xarajatlar?.tafsilot && Object.entries(pl.xarajatlar.tafsilot).map(([k, v]) => (
            <Row key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={`-${N(v).toLocaleString()}`} indent={1} color="text-red-400" />
          ))}
          <Row label="Jami xarajat" value={`-${N(pl.xarajatlar?.jami).toLocaleString()}`} bold color="text-red-500" />
          <div className={`flex justify-between p-4 rounded-b-xl text-lg font-bold ${
            pl.sof_foyda?.holat === "foyda" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}>
            <span>SOF FOYDA</span>
            <span>{N(pl.sof_foyda?.summa).toLocaleString()} so&apos;m ({pl.sof_foyda?.margin_foiz}%)</span>
          </div>
        </Card>
      )}

      {/* Balance Sheet */}
      {!loading && tab === "bs" && bs && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-t-xl border-b"><h3 className="font-bold text-emerald-700">AKTIVLAR</h3></div>
            <Row label="Kassa (naqd)" value={N(bs.aktivlar?.kassa_naqd).toLocaleString()} />
            <Row label="Kassa (karta)" value={N(bs.aktivlar?.kassa_karta).toLocaleString()} />
            <Row label="Debitorlar (qarzlar)" value={N(bs.aktivlar?.debitorlar).toLocaleString()} />
            <Row label="Ombor qiymati" value={N(bs.aktivlar?.ombor_qiymat).toLocaleString()} />
            <Row label="JAMI AKTIVLAR" value={N(bs.aktivlar?.jami).toLocaleString()} bold />
          </Card>
          <Card>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-t-xl border-b"><h3 className="font-bold text-blue-700">PASSIV + KAPITAL</h3></div>
            <Row label="Kreditorlar" value={N(bs.passivlar?.jami).toLocaleString()} />
            <Row label="Taqsimlanmagan foyda" value={N(bs.kapital?.taqsimlanmagan_foyda).toLocaleString()} />
            <div className={`p-3 text-center text-sm font-bold ${bs.balans_tekshiruv?.muvozanat ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
              {bs.balans_tekshiruv?.muvozanat ? "✅ Balans muvozanatda" : "⚠️ Balans nomuvofiq!"}
            </div>
          </Card>
        </div>
      )}

      {/* Cash Flow */}
      {!loading && tab === "cf" && cf && (
        <Card>
          <div className="p-4 border-b bg-cyan-50 dark:bg-cyan-900/10 rounded-t-xl">
            <h2 className="font-bold">💧 Pul oqimi</h2>
          </div>
          <div className="px-4 py-1 bg-emerald-50 dark:bg-emerald-900/10 text-xs font-semibold text-emerald-600">KIRIMLAR</div>
          <Row label="Sotuvdan" value={N(cf.kirim?.sotuvdan).toLocaleString()} indent={1} />
          <Row label="Qarz yig'ildi" value={N(cf.kirim?.qarz_yigildi).toLocaleString()} indent={1} />
          <Row label="JAMI KIRIM" value={N(cf.kirim?.jami).toLocaleString()} bold color="text-emerald-600" />
          <div className="px-4 py-1 bg-red-50 dark:bg-red-900/10 text-xs font-semibold text-red-600">CHIQIMLAR</div>
          <Row label="Tovar xaridi" value={N(cf.chiqim?.tovar_xaridi).toLocaleString()} indent={1} />
          <Row label="Xarajatlar" value={N(cf.chiqim?.xarajatlar).toLocaleString()} indent={1} />
          <Row label="JAMI CHIQIM" value={N(cf.chiqim?.jami).toLocaleString()} bold color="text-red-600" />
          <div className={`p-4 rounded-b-xl text-center text-lg font-bold ${
            cf.sof_pul_oqimi?.holat === "ijobiy" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}>
            Sof pul oqimi: {N(cf.sof_pul_oqimi?.summa).toLocaleString()} so&apos;m
          </div>
        </Card>
      )}

      {/* KPI */}
      {!loading && tab === "kpi" && kpi && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Gross Margin", value: kpi.gross_margin, icon: "📊", color: "emerald" },
            { label: "Net Margin", value: kpi.net_margin, icon: "💰", color: "blue" },
            { label: "Inventory Turnover", value: kpi.inventory_turnover + "x", icon: "📦", color: "purple" },
            { label: "Days Sales Outstanding", value: kpi.days_sales_outstanding + " kun", icon: "⏰", color: "amber" },
            { label: "O'rtacha chek", value: N(kpi.average_order_value).toLocaleString(), icon: "🧾", color: "emerald" },
            { label: "Kunlik sotuv", value: kpi.sotuv_soni_kunlik, icon: "📈", color: "blue" },
            { label: "Faol klientlar", value: kpi.klient_soni, icon: "👥", color: "purple" },
            { label: "Ombor qiymati", value: N(kpi.ombor_qiymati).toLocaleString(), icon: "🏭", color: "amber" },
          ].map((s, i) => (
            <Card key={i} className="p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
