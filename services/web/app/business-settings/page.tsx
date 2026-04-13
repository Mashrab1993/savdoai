"use client"

import { useState, useCallback, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/ui/page-header"
import {
  Settings2, Plus, Pencil, Trash2, Tag, MapPin, DollarSign,
  Users, ShoppingBag, Compass, Package, XCircle, Ruler, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api/client"

// ── Types ───────────────────────────────────────────────────
type SettingItem = {
  id: number
  nomi: string
  rang?: string
  qisqa?: string
  turi?: string
  ota_id?: number
  tartib?: number
  faol?: boolean
  foiz?: number
}

type SettingSection = {
  key: string
  icon: typeof Settings2
  gradient: string
}

// ── Sections config ─────────────────────────────────────────
const SECTIONS: SettingSection[] = [
  { key: "narx_turlar", icon: DollarSign, gradient: "from-emerald-500 to-teal-600" },
  { key: "klient_kategoriyalar", icon: Users, gradient: "from-blue-500 to-indigo-600" },
  { key: "klient_turlari", icon: Users, gradient: "from-violet-500 to-purple-600" },
  { key: "savdo_kanallari", icon: ShoppingBag, gradient: "from-orange-500 to-red-600" },
  { key: "savdo_yunalishlari", icon: Compass, gradient: "from-cyan-500 to-blue-600" },
  { key: "teglar", icon: Tag, gradient: "from-pink-500 to-rose-600" },
  { key: "hududlar", icon: MapPin, gradient: "from-green-500 to-emerald-600" },
  { key: "rad_etish_sabablari", icon: XCircle, gradient: "from-red-500 to-rose-600" },
  { key: "birliklar", icon: Ruler, gradient: "from-amber-500 to-yellow-600" },
]

const LABELS: Record<string, Record<string, string>> = {
  narx_turlar:          { uz: "Narx turlari",          ru: "Типы цен" },
  klient_kategoriyalar: { uz: "Klient kategoriyalar",   ru: "Категории клиентов" },
  klient_turlari:       { uz: "Klient turlari",         ru: "Типы клиентов" },
  savdo_kanallari:      { uz: "Savdo kanallari",        ru: "Каналы продаж" },
  savdo_yunalishlari:   { uz: "Savdo yunalishlari",     ru: "Направления продаж" },
  teglar:               { uz: "Teglar",                  ru: "Теги" },
  hududlar:             { uz: "Hududlar",                ru: "Регионы" },
  rad_etish_sabablari:  { uz: "Rad etish sabablari",    ru: "Причины отказа" },
  birliklar:            { uz: "O'lchov birliklar",      ru: "Единицы измерения" },
}

const COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B",
  "#10B981", "#06B6D4", "#3B82F6", "#F97316", "#84CC16",
]

export default function BusinessSettingsPage() {
  const { locale } = useLocale()
  const [activeSection, setActiveSection] = useState(SECTIONS[0].key)
  const [items, setItems] = useState<SettingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<SettingItem | null>(null)
  const [form, setForm] = useState({ nomi: "", rang: "#6366F1", faol: true, foiz: 0, qisqa: "", turi: "umumiy" })
  const [saving, setSaving] = useState(false)

  const t = {
    title: locale === "uz" ? "Biznes sozlamalari" : "Бизнес настройки",
    subtitle: locale === "uz" ? "SalesDoc uslubidagi sozlamalar" : "Настройки в стиле SalesDoc",
    add: locale === "uz" ? "Qo'shish" : "Добавить",
    edit: locale === "uz" ? "Tahrirlash" : "Редактировать",
    save: locale === "uz" ? "Saqlash" : "Сохранить",
    cancel: locale === "uz" ? "Bekor" : "Отмена",
    delete: locale === "uz" ? "O'chirish" : "Удалить",
    name: locale === "uz" ? "Nomi" : "Название",
    color: locale === "uz" ? "Rang" : "Цвет",
    active: locale === "uz" ? "Faol" : "Активный",
    empty: locale === "uz" ? "Hali qo'shilmagan" : "Пока ничего не добавлено",
  }

  const fetchItems = useCallback(async (section: string) => {
    setLoading(true)
    try {
      const data = await api.get<{ items: SettingItem[] }>(`/api/v1/sozlamalar/${section}`)
      setItems(data.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems(activeSection) }, [activeSection, fetchItems])

  function openAdd() {
    setEditItem(null)
    setForm({ nomi: "", rang: COLORS[Math.floor(Math.random() * COLORS.length)], faol: true, foiz: 0, qisqa: "", turi: "umumiy" })
    setDialogOpen(true)
  }

  function openEdit(item: SettingItem) {
    setEditItem(item)
    setForm({
      nomi: item.nomi,
      rang: item.rang || "#6366F1",
      faol: item.faol ?? true,
      foiz: item.foiz || 0,
      qisqa: item.qisqa || "",
      turi: item.turi || "umumiy",
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.nomi.trim()) return
    setSaving(true)
    try {
      if (editItem) {
        await api.put(`/api/v1/sozlamalar/${activeSection}/${editItem.id}`, form)
      } else {
        await api.post(`/api/v1/sozlamalar/${activeSection}`, form)
      }
      setDialogOpen(false)
      fetchItems(activeSection)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(locale === "uz" ? "O'chirishni tasdiqlaysizmi?" : "Подтвердить удаление?")) return
    try {
      await api.delete(`/api/v1/sozlamalar/${activeSection}/${id}`)
      fetchItems(activeSection)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xatolik")
    }
  }

  const sectionInfo = SECTIONS.find(s => s.key === activeSection)!
  const SectionIcon = sectionInfo.icon

  return (
    <AdminLayout title={t.title}>
      <div className="space-y-5">
        <PageHeader
          icon={Settings2}
          gradient="indigo"
          title={t.title}
          subtitle={t.subtitle}
        />

        {/* Section tabs */}
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(s => {
            const Icon = s.icon
            const label = LABELS[s.key]?.[locale] || s.key
            const active = activeSection === s.key
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card/60 border border-border/60 text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SectionIcon className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-semibold">
                {LABELS[activeSection]?.[locale] || activeSection}
              </h2>
              <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
            </div>
            <Button size="sm" onClick={openAdd} className="gap-1">
              <Plus className="w-3.5 h-3.5" />
              {t.add}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">{t.empty}</div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-background/50 border border-border/40 rounded-xl px-4 py-2.5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.rang || "#6366F1" }}
                    />
                    <span className="text-sm font-medium">{item.nomi}</span>
                    {item.qisqa && (
                      <Badge variant="outline" className="text-[10px]">{item.qisqa}</Badge>
                    )}
                    {item.foiz != null && item.foiz > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{item.foiz}%</Badge>
                    )}
                    {item.faol === false && (
                      <Badge variant="destructive" className="text-[10px]">
                        {locale === "uz" ? "Nofaol" : "Неактивен"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editItem ? t.edit : t.add}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t.name}</label>
                <Input
                  value={form.nomi}
                  onChange={e => setForm(f => ({ ...f, nomi: e.target.value }))}
                  placeholder={t.name}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t.color}</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all",
                        form.rang === c ? "border-foreground scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setForm(f => ({ ...f, rang: c }))}
                    />
                  ))}
                </div>
              </div>

              {activeSection === "narx_turlar" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {locale === "uz" ? "Foiz (%)" : "Процент (%)"}
                  </label>
                  <Input
                    type="number"
                    value={form.foiz}
                    onChange={e => setForm(f => ({ ...f, foiz: Number(e.target.value) }))}
                  />
                </div>
              )}

              {activeSection === "birliklar" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {locale === "uz" ? "Qisqartma" : "Сокращение"}
                  </label>
                  <Input
                    value={form.qisqa}
                    onChange={e => setForm(f => ({ ...f, qisqa: e.target.value }))}
                    placeholder="dona, kg, kr..."
                  />
                </div>
              )}

              {activeSection === "teglar" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {locale === "uz" ? "Turi" : "Тип"}
                  </label>
                  <Select value={form.turi} onValueChange={v => setForm(f => ({ ...f, turi: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="umumiy">Umumiy</SelectItem>
                      <SelectItem value="tovar">Tovar</SelectItem>
                      <SelectItem value="klient">Klient</SelectItem>
                      <SelectItem value="buyurtma">Buyurtma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">{t.active}</label>
                <Switch
                  checked={form.faol}
                  onCheckedChange={v => setForm(f => ({ ...f, faol: v }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
              <Button onClick={handleSave} disabled={saving || !form.nomi.trim()}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
