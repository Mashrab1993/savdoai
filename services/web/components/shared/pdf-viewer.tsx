"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer, X, Maximize2 } from "lucide-react"

interface PDFViewerProps {
  open: boolean
  onClose: () => void
  pdfUrl?: string
  pdfBase64?: string
  title: string
}

/**
 * Inline PDF ko'rish — chek, nakladnoy, faktura
 *
 * Ishlatish:
 *   <PDFViewer open={open} onClose={() => setOpen(false)}
 *     pdfBase64={data} title="Chek #123" />
 */
export function PDFViewer({
  open,
  onClose,
  pdfUrl,
  pdfBase64,
  title,
}: PDFViewerProps) {
  const [fullscreen, setFullscreen] = useState(false)

  const src = pdfBase64
    ? `data:application/pdf;base64,${pdfBase64}`
    : pdfUrl || ""

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = src
    a.download = `${title.replace(/\s+/g, "_")}.pdf`
    a.click()
  }

  const handlePrint = () => {
    const w = window.open(src, "_blank")
    if (w) {
      w.addEventListener("load", () => w.print())
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`flex flex-col p-0 gap-0 ${
          fullscreen
            ? "max-w-[100vw] h-[100vh] rounded-none"
            : "max-w-4xl h-[85vh]"
        }`}
      >
        <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-sm font-medium truncate flex-1">
            {title}
          </DialogTitle>
          <div className="flex items-center gap-1 ml-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setFullscreen(!fullscreen)}
              title="To'liq ekran"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handlePrint}
              title="Chop etish"
            >
              <Printer className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleDownload}
              title="Yuklab olish"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-muted/30">
          {src ? (
            <iframe
              src={src}
              className="w-full h-full border-0"
              title={title}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              PDF fayl topilmadi
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
