"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Shield, Calendar } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const KEYS = [
  { id: 1, nomi: "Asosiy API key", key: "sk_live_*****************************", created: "2026-01-15", scope: "full", lastUsed: "5 daqiqa oldin" },
  { id: 2, nomi: "Telegram bot key", key: "tg_*****************************", created: "2026-02-20", scope: "bot", lastUsed: "1 soat oldin" },
  { id: 3, nomi: "Mobile app key", key: "mb_*****************************", created: "2026-03-01", scope: "read-write", lastUsed: "Hech qachon" },
]

export default function ApiKeysPage() {
  const [showKey, setShowKey] = useState<Record<number, boolean>>({})

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={Key}
          gradient="amber"
          title="API kalitlar"
          subtitle="Tashqi tizimlar uchun API kalitlar"
        />
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi kalit
          </Button>
        </div>

        {/* Warning */}
        <div className="bg-amber-500/10 dark:bg-amber-950/20 rounded-xl border border-amber-500/30 p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <div className="font-bold mb-1">Xavfsizlik haqida</div>
              <div>API kalitlarni hech kimga bermang. Agar kalit oshkor bo'lsa, darhol uni o'chiring va yangisini yarating.</div>
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomi</TableHead>
                <TableHead>API kalit</TableHead>
                <TableHead>Yaratilgan</TableHead>
                <TableHead className="text-center">Huquqlar</TableHead>
                <TableHead>Oxirgi ishlatilgan</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {KEYS.map(k => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.nomi}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted dark:bg-muted px-2 py-1 rounded">
                        {showKey[k.id] ? "sk_live_abc123def456ghi789" : k.key}
                      </code>
                      <button onClick={() => setShowKey(s => ({ ...s, [k.id]: !s[k.id] }))}>
                        {showKey[k.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button>
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{k.created}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={k.scope === "full" ? "default" : "secondary"} className="text-xs">
                      {k.scope === "full" ? "To'liq kirish" : k.scope === "bot" ? "Bot" : "O'qish/Yozish"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{k.lastUsed}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-rose-500 dark:text-rose-400"><Trash2 className="w-3 h-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
