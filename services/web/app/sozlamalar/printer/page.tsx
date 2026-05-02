"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { Printer } from "lucide-react"
const ITEMS = [
  { id: 1, name: "Markaziy ofis HP LaserJet", desc: "192.168.1.50 · A4 doc/invoice", usage: 248, active: true, color: "blue" },
  { id: 2, name: "Sergeli filial Canon", desc: "192.168.5.42 · A4 doc", usage: 142, active: true, color: "emerald" },
  { id: 3, name: "Sklad termo printer (Star)", desc: "USB · 80mm chek", usage: 412, active: true, color: "violet" },
  { id: 4, name: "Sklad etiket (Zebra ZT231)", desc: "Network · barcode/datamatrix", usage: 184, active: true, color: "amber" },
  { id: 5, name: "Yangiyul filial Brother", desc: "192.168.7.18 · A4", usage: 86, active: true, color: "rose" },
  { id: 6, name: "Mobile printer (Bluetooth)", desc: "Star SM-T300 · 58mm", usage: 1240, active: true, color: "cyan" },
]
export default function PrinterPage() {
  return <SimpleCrudPage title="Printerlar" subtitle="Tarmoq + USB + Bluetooth printerlar" backHref="/sozlamalar" items={ITEMS} addLabel="Yangi printer" icon={Printer} accentColor="blue" />
}
