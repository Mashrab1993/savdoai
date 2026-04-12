"use client";

import { PageHeader } from "@/components/ui/page-header"
import { Settings } from "lucide-react"
import { useState, useEffect, useCallback } from "react";
import { PageLoading } from "@/components/shared/page-states"

// ═══════════════════════════════════════════════════════════
//  CONFIG MODULLAR RO'YXATI
// ═══════════════════════════════════════════════════════════

const MODULLAR = [
  {
    id: "klient", nomi: "Klient sozlamalari", icon: "👤",
    tavsif: "Klient formasida qaysi fieldlar ko'rinadi va majburiy",
    fieldlar: [
      { key: "nom_majburiy", label: "Ism majburiy", type: "bool" },
      { key: "firma_nomi_faol", label: "Firma nomi ko'rinadi", type: "bool" },
      { key: "firma_nomi_majburiy", label: "Firma nomi majburiy", type: "bool" },
      { key: "telefon_majburiy", label: "Telefon majburiy", type: "bool" },
      { key: "manzil_faol", label: "Manzil ko'rinadi", type: "bool" },
      { key: "manzil_majburiy", label: "Manzil majburiy", type: "bool" },
      { key: "lokatsiya_faol", label: "GPS lokatsiya", type: "bool" },
      { key: "lokatsiya_majburiy", label: "GPS majburiy", type: "bool" },
      { key: "inn_faol", label: "INN ko'rinadi", type: "bool" },
      { key: "inn_majburiy", label: "INN majburiy", type: "bool" },
      { key: "bank_faol", label: "Bank ko'rinadi", type: "bool" },
      { key: "shartnoma_faol", label: "Shartnoma ko'rinadi", type: "bool" },
      { key: "kategoriya_faol", label: "Kategoriya ko'rinadi", type: "bool" },
      { key: "foto_faol", label: "Foto ko'rinadi", type: "bool" },
      { key: "foto_majburiy", label: "Foto majburiy", type: "bool" },
      { key: "tashrif_kunlari_faol", label: "Tashrif kunlari", type: "bool" },
    ]
  },
  {
    id: "buyurtma", nomi: "Buyurtma sozlamalari", icon: "📦",
    tavsif: "Buyurtma yaratish qoidalari va cheklovlari",
    fieldlar: [
      { key: "checkin_majburiy", label: "Check-in majburiy", type: "bool" },
      { key: "foto_majburiy", label: "Foto majburiy", type: "bool" },
      { key: "qoldiq_kiritish_majburiy", label: "Qoldiq kiritish majburiy", type: "bool" },
      { key: "lokatsiyani_tekshirish", label: "GPS tekshirish", type: "bool" },
      { key: "nasiyaga_ruxsat", label: "Nasiyaga ruxsat", type: "bool" },
      { key: "almashtirishga_ruxsat", label: "Almashtirish ruxsati", type: "bool" },
      { key: "qaytarishga_ruxsat", label: "Qaytarish ruxsati", type: "bool" },
      { key: "qarz_cheki", label: "Qarz ogohlantirish", type: "bool" },
      { key: "zarar_cheki", label: "Zarar ogohlantirish", type: "bool" },
      { key: "yaroqlilik_muddati_korsatish", label: "Yaroqlilik muddati", type: "bool" },
      { key: "min_summa", label: "Minimal buyurtma summasi", type: "number" },
      { key: "nasiya_max_kun", label: "Nasiya max kun", type: "number" },
      { key: "max_nasiya_summa", label: "Max nasiya summa", type: "number" },
    ]
  },
  {
    id: "gps", nomi: "GPS sozlamalari", icon: "📍",
    tavsif: "GPS tracking va lokatsiya xizmati",
    fieldlar: [
      { key: "gps_yoqilgan", label: "GPS tracking yoqilgan", type: "bool" },
      { key: "fon_tracking", label: "Fon tracking", type: "bool" },
      { key: "batareya_holati_yuborish", label: "Batareya holati", type: "bool" },
      { key: "tracking_interval_daqiqa", label: "Tracking interval (daqiqa)", type: "number" },
      { key: "min_aniqlik_metr", label: "Min aniqlik (metr)", type: "number" },
      { key: "ish_vaqti_boshlanishi", label: "Ish boshlanishi", type: "time" },
      { key: "ish_vaqti_tugashi", label: "Ish tugashi", type: "time" },
    ]
  },
  {
    id: "printer", nomi: "Printer sozlamalari", icon: "🖨️",
    tavsif: "Chek chop etish sozlamalari",
    fieldlar: [
      { key: "printer_yoqilgan", label: "Printer yoqilgan", type: "bool" },
      { key: "logo_korsatish", label: "Logo ko'rsatish", type: "bool" },
      { key: "qr_kod_korsatish", label: "QR kod ko'rsatish", type: "bool" },
      { key: "chegirma_korsatish", label: "Chegirma ko'rsatish", type: "bool" },
      { key: "klient_balans_korsatish", label: "Klient balans", type: "bool" },
      { key: "printer_kengligi", label: "Printer kengligi (mm)", type: "select", options: [58, 80] },
      { key: "shrift_hajmi", label: "Shrift hajmi", type: "select", options: ["small", "normal", "large"] },
    ]
  },
  {
    id: "aksiya", nomi: "Aksiya sozlamalari", icon: "🎁",
    tavsif: "Chegirma va aksiya tizimi",
    fieldlar: [
      { key: "aksiya_yoqilgan", label: "Aksiya tizimi yoqilgan", type: "bool" },
      { key: "manual_chegirma_ruxsat", label: "Manual chegirma", type: "bool" },
      { key: "bonus_tizimi", label: "Bonus ball tizimi", type: "bool" },
      { key: "server_hisoblash", label: "Serverda hisoblash", type: "bool" },
      { key: "max_chegirma_foiz", label: "Max chegirma (%)", type: "number" },
    ]
  },
  {
    id: "ombor", nomi: "Ombor sozlamalari", icon: "🏭",
    tavsif: "Ombor va qoldiq boshqaruvi",
    fieldlar: [
      { key: "multi_ombor", label: "Ko'p omborli rejim", type: "bool" },
      { key: "manfiy_qoldiqqa_ruxsat", label: "Manfiy qoldiqqa ruxsat", type: "bool" },
      { key: "barcode_scan_yoqilgan", label: "Barcode scan", type: "bool" },
      { key: "tara_boshqaruvi", label: "Tara boshqaruvi", type: "bool" },
      { key: "qoldiq_ogohlantirish_chegarasi", label: "Kam qoldiq chegarasi", type: "number" },
    ]
  },
  {
    id: "sync", nomi: "Sync sozlamalari", icon: "🔄",
    tavsif: "Sinxronizatsiya va offline rejim",
    fieldlar: [
      { key: "sync_log_yoqilgan", label: "Sync log yoqilgan", type: "bool" },
      { key: "auto_sync_interval_daqiqa", label: "Auto sync interval (daqiqa)", type: "number" },
      { key: "sync_log_saqlash_kun", label: "Log saqlash (kun)", type: "number" },
      { key: "offline_queue_max", label: "Offline queue max", type: "number" },
      { key: "batch_size", label: "Batch hajmi", type: "number" },
    ]
  },
  {
    id: "notifikatsiya", nomi: "Bildirishnomalar", icon: "🔔",
    tavsif: "Eslatmalar va bildirishnomalar",
    fieldlar: [
      { key: "kunlik_hisobot", label: "Kunlik hisobot", type: "bool" },
      { key: "qarz_eslatma", label: "Qarz eslatma", type: "bool" },
      { key: "kam_qoldiq_ogohlantirish", label: "Kam qoldiq ogohlantirish", type: "bool" },
      { key: "yangi_buyurtma_bildirishnoma", label: "Yangi buyurtma xabari", type: "bool" },
      { key: "kunlik_hisobot_vaqti", label: "Hisobot vaqti", type: "time" },
    ]
  },
];

// ═══════════════════════════════════════════════════════════
//  SAHIFA KOMPONENTI
// ═══════════════════════════════════════════════════════════

export default function ConfigPage() {
  const [activeModul, setActiveModul] = useState("klient");
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  // Config yuklash
  useEffect(() => {
    const yukla = async () => {
      try {
        const res = await fetch(`${API_BASE}/config`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (e) {
        console.error("Config yuklanmadi:", e);
      } finally {
        setLoading(false);
      }
    };
    yukla();
  }, [API_BASE]);

  // Fieldni o'zgartirish
  const handleChange = useCallback((modulId: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [modulId]: { ...(prev[modulId] || {}), [key]: value },
    }));
    setSaved(false);
  }, []);

  // Saqlash
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const modulData = config[activeModul] || {};
      const res = await fetch(`${API_BASE}/config/${activeModul}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ sozlamalar: modulData }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error("Saqlash xatosi:", e);
    } finally {
      setSaving(false);
    }
  }, [config, activeModul, API_BASE]);

  const currentModul = MODULLAR.find(m => m.id === activeModul);
  const modulConfig = config[activeModul] || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <PageHeader
          icon={Settings}
          gradient="blue"
          title="Server konfiguratsiya"
          subtitle="Ilovani masofadan boshqaring — har bir sozlama real-time qo'llaniladi"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Modul ro'yxati */}
        <div className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
          {MODULLAR.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveModul(m.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeModul === m.id
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                  : "text-muted-foreground hover:bg-muted/50 dark:text-muted-foreground dark:hover:bg-muted"
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.nomi}</span>
            </button>
          ))}
        </div>

        {/* Sozlamalar paneli */}
        <div className="flex-1 bg-card rounded-xl border border-border dark:border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span>{currentModul?.icon}</span>
                {currentModul?.nomi}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{currentModul?.tavsif}</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-primary hover:bg-primary/90 text-white"
              } disabled:opacity-50`}
            >
              {saving ? "Saqlanmoqda..." : saved ? "✓ Saqlandi" : "Saqlash"}
            </button>
          </div>

          <div className="space-y-3">
            {currentModul?.fieldlar.map(f => (
              <div key={f.key} className="flex items-center justify-between py-2 border-b border-border/60 dark:border-border last:border-0">
                <label className="text-sm text-foreground dark:text-muted-foreground/50">{f.label}</label>

                {f.type === "bool" && (
                  <button
                    onClick={() => handleChange(activeModul, f.key, !modulConfig[f.key])}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      modulConfig[f.key] ? "bg-emerald-500" : "bg-muted-foreground/40"
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full shadow transition-transform ${
                      modulConfig[f.key] ? "translate-x-5" : ""
                    }`} />
                  </button>
                )}

                {f.type === "number" && (
                  <input
                    type="number"
                    value={modulConfig[f.key] ?? ""}
                    onChange={e => handleChange(activeModul, f.key, Number(e.target.value))}
                    className="w-28 px-3 py-1.5 text-sm border rounded-lg bg-muted/50 dark:bg-muted dark:border-border text-right"
                  />
                )}

                {f.type === "time" && (
                  <input
                    type="time"
                    value={modulConfig[f.key] ?? ""}
                    onChange={e => handleChange(activeModul, f.key, e.target.value)}
                    className="px-3 py-1.5 text-sm border rounded-lg bg-muted/50 dark:bg-muted dark:border-border"
                  />
                )}

                {f.type === "select" && (
                  <select
                    value={modulConfig[f.key] ?? ""}
                    onChange={e => handleChange(activeModul, f.key, e.target.value)}
                    className="px-3 py-1.5 text-sm border rounded-lg bg-muted/50 dark:bg-muted dark:border-border"
                  >
                    {f.options?.map((o: any) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
