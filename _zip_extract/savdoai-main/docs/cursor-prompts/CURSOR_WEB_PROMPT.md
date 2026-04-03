# SAVDOAI WEB PANEL — TO'LIQ REDESIGN VA YANGI XUSUSIYATLAR

> **Path:** `services/web/`
> **Stack:** Next.js 16, React 19, Tailwind CSS, shadcn/ui, Recharts, Lucide icons
> **i18n:** Uzbek (uz) + Russian (ru) — `lib/i18n.ts`
> **API:** FastAPI backend — `lib/api/services.ts`, `lib/api/types.ts`
> **Auth:** JWT token — `lib/auth/auth-context.tsx`
> **Real-time:** WebSocket — `hooks/use-websocket.ts`

---

## UMUMIY QOIDALAR

1. **shadcn/ui** komponentlardan foydalanish — yangi komponent yaratma, mavjudini ishlatish
2. **Dark mode** — har bir rang `dark:` variant bilan
3. **Mobile first** — barcha sahifalar telefonda qulay bo'lishi kerak (`sm:`, `md:`, `lg:`)
4. **i18n** — barcha matnlar `translations` orqali (`lib/i18n.ts` ga qo'sh)
5. **API** — faqat `lib/api/services.ts` orqali, to'g'ridan-to'g'ri fetch QILMA
6. **Loading** — `<PageLoading />` yoki `<Skeleton />` ishlatish
7. **Error** — `<PageError />` + toast notification
8. **TypeScript** — `any` ISHLATMA, har doim type/interface yoz
9. **Performance** — `useMemo`, `useCallback` kerak joyda. Katta ro'yxatlar `virtualized`
10. **Accessibility** — `aria-label`, keyboard navigation, focus management

---

## 1. DASHBOARD REDESIGN

**Fayl:** `app/dashboard/page.tsx`

### 1.1 Yangi KPI kartalar (2 qator × 4 ustun)

**1-qator (asosiy):**
| KPI | Icon | Rang | Ma'lumot |
|-----|------|------|----------|
| Bugungi sotuv | `DollarSign` | yashil gradient | `stats.todayRevenue` + o'tgan kunga nisbatan % |
| Bugungi foyda | `TrendingUp` | ko'k gradient | `stats.todayProfit` + margin % |
| Faol mijozlar | `Users` | binafsha | `stats.activeClients` / `stats.totalClients` |
| Kassa qoldiq | `Landmark` | oltin | `stats.todayCashIncome` naqd + karta |

**2-qator (ogohlantirish):**
| KPI | Icon | Rang | Ma'lumot |
|-----|------|------|----------|
| Qarzlar | `CreditCard` | qizil | `stats.totalDebt` + muddati o'tgan soni |
| Kam qoldiq | `AlertTriangle` | sariq | tovarlar qoldig'i < min_qoldiq soni |
| Shogird xarajat | `GraduationCap` | pushti | bugungi shogird xarajat |
| Kutilayotgan | `Hourglass` | kulrang | kutilayotgan fakturalar soni |

**Har bir KPI karta:**
```tsx
<Card className="relative overflow-hidden group hover:shadow-lg transition-all">
  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <div className="flex items-center gap-1 mt-1">
          {trend > 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown />}
          <span className="text-xs">{trend}% {locale === "uz" ? "kechagiga" : "ко вчера"}</span>
        </div>
      </div>
      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
        <DollarSign className="w-5 h-5 text-green-600" />
      </div>
    </div>
  </CardContent>
</Card>
```

### 1.2 Grafiklar

**Asosiy grafik — Haftalik sotuv trend (AreaChart):**
- Oxirgi 7 kun
- Sotuv summasi + foyda — ikki chiziq
- Gradient fill
- Tooltip: sana, sotuv, foyda, margin %
- Responsive — mobile da 200px balandlik, desktop 300px

**Ikkinchi grafik — Top 5 tovar (BarChart horizontal):**
- Eng ko'p sotilgan 5 ta tovar
- Bar bilan vizualizatsiya
- Tovar nomi + summa ko'rsatish

**Uchinchi grafik — Sotuv turi (Donut/PieChart):**
- Naqd / Karta / Nasiya / O'tkazma — 4 ta segment
- Markazdagi raqam: bugungi jami sotuv

### 1.3 Real-time indikator
Header da yashil/qizil nuqta — WebSocket ulanish holati:
```tsx
<div className={cn(
  "w-2 h-2 rounded-full animate-pulse",
  connected ? "bg-green-500" : "bg-red-500"
)} />
```

### 1.4 So'nggi faoliyat ro'yxati
Dashboard pastida — oxirgi 10 ta tranzaksiya:
```
🟢 Sotuv: Anvar aka — 5 ta Adidas futbolka — 250,000 so'm (2 daqiqa oldin)
🔴 Qarz: Bekzod — 100,000 so'm muddati o'tgan (1 soat oldin)
🟡 Kirim: 10 ta Nike krossovka — 2,000,000 so'm (3 soat oldin)
```

---

## 2. SOTUV SAHIFASI — TEZKOR POS UX

**Fayl:** `app/sales/page.tsx` — to'liq qayta yozish

### 2.1 Layout (2 ustun — desktop, 1 ustun — mobile)

```
┌─────────────────────────┬──────────────────┐
│                         │                  │
│  TOVAR QIDIRISH         │  SAVAT           │
│  ┌───────────────────┐  │  ┌────────────┐  │
│  │ 🔍 Qidirish...    │  │  │ Anvar aka  │  │
│  └───────────────────┘  │  │ ──────────── │  │
│                         │  │ Futbolka ×3  │  │
│  ┌─────┐┌─────┐┌─────┐ │  │ 150,000     │  │
│  │TOVAR││TOVAR││TOVAR│ │  │ Krossovka ×1│  │
│  │ 📦  ││ 📦  ││ 📦  │ │  │ 300,000     │  │
│  │50k  ││80k  ││120k │ │  │ ──────────── │  │
│  └─────┘└─────┘└─────┘ │  │ JAMI:450,000│  │
│  ┌─────┐┌─────┐┌─────┐ │  │              │  │
│  │TOVAR││TOVAR││TOVAR│ │  │ [💾 Saqlash] │  │
│  └─────┘└─────┘└─────┘ │  │ [🖨 Chek]   │  │
│                         │  └────────────┘  │
└─────────────────────────┴──────────────────┘
```

### 2.2 Tovar kartalar (grid)
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
  {filteredProducts.map(p => (
    <button
      key={p.id}
      onClick={() => addToCart(p)}
      className={cn(
        "p-3 rounded-xl border text-left transition-all hover:shadow-md active:scale-95",
        "bg-card hover:border-primary/50",
        p.qoldiq <= 0 && "opacity-40 pointer-events-none"
      )}
    >
      {p.rasm_url ? (
        <img src={p.rasm_url} className="w-full h-20 object-cover rounded-lg mb-2" />
      ) : (
        <div className="w-full h-20 bg-muted rounded-lg mb-2 flex items-center justify-center">
          <Package className="w-8 h-8 text-muted-foreground/30" />
        </div>
      )}
      <p className="font-medium text-sm truncate">{p.nomi}</p>
      <p className="text-xs text-muted-foreground">{p.qoldiq} {p.birlik}</p>
      <p className="font-bold text-primary mt-1">{formatCurrency(p.sotish_narxi)}</p>
    </button>
  ))}
</div>
```

### 2.3 Savat (sticky right panel)
```tsx
<div className="lg:sticky lg:top-20 bg-card rounded-xl border p-4 space-y-3">
  {/* Klient tanlash */}
  <Combobox
    options={clients}
    placeholder="Klient tanlang yoki yangi..."
    onSelect={setSelectedClient}
    allowCustom={true}
  />

  {/* Savat itemlar */}
  {cart.map(item => (
    <div className="flex items-center gap-2 py-2 border-b">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.nomi}</p>
        <p className="text-xs text-muted-foreground">{formatCurrency(item.narx)} × {item.miqdor}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => decrementItem(item.id)}>
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-8 text-center text-sm font-bold">{item.miqdor}</span>
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => incrementItem(item.id)}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      <p className="font-bold text-sm w-20 text-right">{formatCurrency(item.jami)}</p>
    </div>
  ))}

  {/* Jami */}
  <div className="border-t pt-3 space-y-2">
    <div className="flex justify-between text-lg font-bold">
      <span>Jami:</span>
      <span className="text-primary">{formatCurrency(total)}</span>
    </div>

    {/* To'lov turi */}
    <div className="grid grid-cols-3 gap-2">
      <Button variant={payType === "naqd" ? "default" : "outline"} size="sm" onClick={() => setPayType("naqd")}>
        💵 Naqd
      </Button>
      <Button variant={payType === "karta" ? "default" : "outline"} size="sm" onClick={() => setPayType("karta")}>
        💳 Karta
      </Button>
      <Button variant={payType === "nasiya" ? "default" : "outline"} size="sm" onClick={() => setPayType("nasiya")}>
        📝 Nasiya
      </Button>
    </div>

    {/* Saqlash */}
    <Button className="w-full h-12 text-base" onClick={handleSave} disabled={cart.length === 0 || saving}>
      {saving ? <Spinner /> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Saqlash</>}
    </Button>
  </div>
</div>
```

### 2.4 Mobile — bottom sheet savat
Mobile da savat pastda sheet sifatida ochiladi:
```tsx
{isMobile && (
  <Sheet>
    <SheetTrigger asChild>
      <Button className="fixed bottom-20 right-4 z-20 h-14 w-14 rounded-full shadow-xl">
        <ShoppingCart className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {cart.length}
          </span>
        )}
      </Button>
    </SheetTrigger>
    <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
      {/* Savat content */}
    </SheetContent>
  </Sheet>
)}
```

---

## 3. MOBILE UX YAXSHILASH

### 3.1 Bottom Navigation yaxshilash
**Fayl:** `components/layout/admin-layout.tsx`

Mavjud bottom nav ni yaxshila — active holatda animated indicator qo'sh:
```tsx
<nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
  <div className="grid grid-cols-5 h-16">
    {mobileNavItems.map(item => {
      const active = pathname === item.href
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 relative",
            active ? "text-primary" : "text-muted-foreground"
          )}
        >
          {active && (
            <span className="absolute top-0 w-8 h-0.5 bg-primary rounded-full" />
          )}
          <item.icon className={cn("w-5 h-5", active && "scale-110")} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </Link>
      )
    })}
  </div>
</nav>
```

**5 ta tab:** Dashboard, Sotuv, Tovarlar, Qarzlar, Kassa

### 3.2 Pull-to-refresh
Har bir sahifada pull-to-refresh qo'sh:
```tsx
// hooks/use-pull-refresh.ts yaratish
export function usePullRefresh(onRefresh: () => Promise<void>) {
  // Touch events bilan pull-to-refresh
}
```

### 3.3 Touch-friendly jadvallar
Jadvallarda horizontal scroll qo'sh:
```tsx
<div className="overflow-x-auto -mx-4 px-4">
  <Table className="min-w-[600px]">
    {/* ... */}
  </Table>
</div>
```

### 3.4 Safe area (iPhone notch)
```css
/* globals.css ga qo'sh */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
```

---

## 4. TOVAR RASM KO'RISH

### 4.1 Product card da rasm
**Fayl:** `app/products/page.tsx`

Jadval ko'rinishdan → karta grid ko'rinishga o'tish tugmasi:
```tsx
const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

{viewMode === "grid" ? (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {products.map(p => (
      <Card key={p.id} className="overflow-hidden hover:shadow-lg transition-all group">
        <div className="aspect-square bg-muted relative">
          {p.rasm_url ? (
            <img src={p.rasm_url} className="w-full h-full object-cover" alt={p.nomi} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground/20" />
            </div>
          )}
          {/* Qoldiq badge */}
          <Badge className={cn(
            "absolute top-2 right-2",
            p.qoldiq <= p.min_qoldiq ? "bg-red-500" : "bg-green-500"
          )}>
            {p.qoldiq} {p.birlik}
          </Badge>
        </div>
        <CardContent className="p-3">
          <p className="font-medium text-sm truncate">{p.nomi}</p>
          <p className="text-xs text-muted-foreground">{p.kategoriya}</p>
          <div className="flex justify-between items-center mt-2">
            <span className="font-bold text-primary">{formatCurrency(p.sotish_narxi)}</span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="w-3 h-3" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
) : (
  <Table>{/* mavjud jadval kodi */}</Table>
)}
```

### 4.2 Rasm yuklash (tovar qo'shish/tahrirlash dialog)
```tsx
<div className="space-y-2">
  <Label>Rasm</Label>
  <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
       onClick={() => fileInputRef.current?.click()}>
    {preview ? (
      <img src={preview} className="w-32 h-32 object-cover rounded-lg mx-auto" />
    ) : (
      <>
        <Camera className="w-8 h-8 mx-auto text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground mt-2">Rasm yuklash (ixtiyoriy)</p>
      </>
    )}
  </div>
  <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
</div>
```

---

## 5. CHEK / NAKLADNOY PDF KO'RISH

### 5.1 Inline PDF viewer component
**Fayl:** `components/shared/pdf-viewer.tsx` yaratish

```tsx
"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer, X } from "lucide-react"

interface PDFViewerProps {
  open: boolean
  onClose: () => void
  pdfUrl?: string  // API URL
  pdfBase64?: string  // yoki base64
  title: string
}

export function PDFViewer({ open, onClose, pdfUrl, pdfBase64, title }: PDFViewerProps) {
  const src = pdfBase64
    ? `data:application/pdf;base64,${pdfBase64}`
    : pdfUrl

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between">
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" /> Chop etish
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={src} download={`${title}.pdf`}>
                <Download className="w-4 h-4 mr-1" /> Yuklab olish
              </a>
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <iframe src={src} className="w-full h-full border-0" title={title} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 5.2 Savdolar sahifasida chek ko'rish tugmasi
**Fayl:** `app/invoices/page.tsx`

Har bir savdo qatorida:
```tsx
<Button size="icon" variant="ghost" onClick={() => openPDF(sale.id)}>
  <Eye className="w-4 h-4" />
</Button>
```

---

## 6. REAL-TIME BILDIRISHNOMA

### 6.1 Notification center (header da)
**Fayl:** `components/layout/top-header.tsx`

Bell icon + badge + dropdown:
```tsx
const { data: notifications } = useApi(notificationService.list)
const unread = notifications?.items?.filter(n => !n.oqilgan).length ?? 0

<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="w-4 h-4" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-80 p-0" align="end">
    <div className="p-3 border-b font-medium text-sm">
      Bildirishnomalar ({unread})
    </div>
    <ScrollArea className="h-80">
      {notifications?.items?.map(n => (
        <div key={n.id} className={cn(
          "p-3 border-b hover:bg-muted/50 cursor-pointer",
          !n.oqilgan && "bg-primary/5"
        )}>
          <p className="text-sm">{n.matn}</p>
          <p className="text-xs text-muted-foreground mt-1">{n.vaqt}</p>
        </div>
      ))}
    </ScrollArea>
  </PopoverContent>
</Popover>
```

### 6.2 Toast notification (WebSocket dan)
**Fayl:** `hooks/use-websocket.ts` ni kengaytirish

```tsx
// app/layout.tsx yoki admin-layout.tsx da:
const { lastMessage } = useWebSocket()

useEffect(() => {
  if (!lastMessage) return
  const { type, data } = lastMessage

  if (type === "sotuv_yangi") {
    toast.success(`💰 Yangi sotuv: ${data.klient} — ${formatCurrency(data.summa)}`)
  } else if (type === "qarz_muddati") {
    toast.warning(`⚠️ Qarz muddati: ${data.klient} — ${formatCurrency(data.summa)}`)
  } else if (type === "kam_qoldiq") {
    toast.info(`📦 Kam qoldiq: ${data.tovar} — ${data.qoldiq} ta qoldi`)
  }
}, [lastMessage])
```

---

## 7. EXCEL IMPORT/EXPORT TUGMALARI

### 7.1 Tovarlar sahifasida
**Fayl:** `app/products/page.tsx`

Header da import/export tugmalari:
```tsx
<div className="flex gap-2">
  <Button variant="outline" size="sm" onClick={handleExport}>
    <Download className="w-4 h-4 mr-1" />
    {locale === "uz" ? "Excel yuklab olish" : "Скачать Excel"}
  </Button>

  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm">
        <Upload className="w-4 h-4 mr-1" />
        {locale === "uz" ? "Import qilish" : "Импорт"}
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Excel import</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mt-2">
            Excel faylni bu yerga tashlang yoki tanlang
          </p>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" ref={fileRef} />
          <Button variant="outline" size="sm" className="mt-3" onClick={() => fileRef.current?.click()}>
            Fayl tanlash
          </Button>
        </div>
        {importResult && (
          <Alert>
            <CheckCircle2 className="w-4 h-4" />
            <AlertDescription>
              {importResult.yaratildi} ta yaratildi, {importResult.yangilandi} ta yangilandi
              {importResult.xatolar.length > 0 && ` (${importResult.xatolar.length} ta xato)`}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DialogContent>
  </Dialog>
</div>
```

### 7.2 Export funksiya
```tsx
async function handleExport() {
  try {
    const data = await tovarImportService.exportExcel()
    const blob = new Blob(
      [Uint8Array.from(atob(data.content_base64), c => c.charCodeAt(0))],
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = data.filename || "tovarlar.xlsx"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Excel yuklab olindi")
  } catch (e) {
    toast.error("Export xatosi")
  }
}
```

### 7.3 Hisobotlar sahifasida ham export
**Fayl:** `app/reports/page.tsx`

PDF va Excel export tugmalari:
```tsx
<div className="flex gap-2">
  <Button size="sm" onClick={() => exportReport("excel")}>
    <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
  </Button>
  <Button size="sm" onClick={() => exportReport("pdf")}>
    <FileText className="w-4 h-4 mr-1" /> PDF
  </Button>
</div>
```

---

## 8. QOLGAN YAXSHILASHLAR

### 8.1 Animated page transitions
```tsx
// components/layout/admin-layout.tsx
<main className="animate-in fade-in slide-in-from-bottom-2 duration-300">
  {children}
</main>
```

### 8.2 Empty states
Har bir sahifada ma'lumot bo'lmaganda chiroyli empty state:
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Package className="w-16 h-16 text-muted-foreground/20 mb-4" />
  <h3 className="font-semibold text-lg">Tovarlar yo'q</h3>
  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
    Birinchi tovaringizni qo'shing yoki Excel dan import qiling
  </p>
  <Button className="mt-4" onClick={() => setAddModalOpen(true)}>
    <Plus className="w-4 h-4 mr-2" /> Tovar qo'shish
  </Button>
</div>
```

### 8.3 Skeleton loading
```tsx
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-7 w-32 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
```

### 8.4 Keyboard shortcuts
```tsx
// hooks/use-keyboard-shortcuts.ts yaratish
useEffect(() => {
  function handleKey(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key) {
        case 'k': e.preventDefault(); router.push('/search'); break  // Global qidirish
        case 'n': e.preventDefault(); openNewSale(); break           // Yangi sotuv
        case 'p': e.preventDefault(); openProducts(); break          // Tovarlar
      }
    }
  }
  window.addEventListener('keydown', handleKey)
  return () => window.removeEventListener('keydown', handleKey)
}, [])
```

---

## i18n QO'SHIMCHALAR

`lib/i18n.ts` ga quyidagi yangi kalitlarni qo'sh:

```typescript
// dashboard
todayRevenue: { uz: "Bugungi sotuv", ru: "Сегодня продажи" },
todayProfit: { uz: "Bugungi foyda", ru: "Сегодня прибыль" },
cashBalance: { uz: "Kassa qoldiq", ru: "Остаток кассы" },
lowStock: { uz: "Kam qoldiq", ru: "Мало на складе" },
recentActivity: { uz: "So'nggi faoliyat", ru: "Последние действия" },

// sales
cart: { uz: "Savat", ru: "Корзина" },
selectClient: { uz: "Klient tanlang", ru: "Выберите клиента" },
cash: { uz: "Naqd", ru: "Наличные" },
card: { uz: "Karta", ru: "Карта" },
credit: { uz: "Nasiya", ru: "В долг" },
total: { uz: "Jami", ru: "Итого" },
saveSale: { uz: "Saqlash", ru: "Сохранить" },

// products
gridView: { uz: "Karta", ru: "Карточки" },
tableView: { uz: "Jadval", ru: "Таблица" },
importExcel: { uz: "Import", ru: "Импорт" },
exportExcel: { uz: "Export", ru: "Экспорт" },

// notifications
notifications: { uz: "Bildirishnomalar", ru: "Уведомления" },
```

---

## TEKSHIRUV

Har bir qadam oxirida:
```bash
npm run build  # TypeScript xatolar bo'lmasligi kerak
npm run lint   # ESLint tekshiruv
```

## TARTIB

1. Dashboard KPI kartalar → grafiklar → real-time
2. Sotuv sahifasi to'liq qayta yozish
3. Mobile UX (bottom nav, safe area, touch tables)
4. Tovar rasm ko'rish (grid view)
5. PDF viewer component
6. Notification center + WebSocket toast
7. Excel import/export
8. Animations, skeletons, empty states, keyboard shortcuts
