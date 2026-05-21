"use client"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Global Error]", error)
  }, [error])

  return (
    <html lang="uz">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        }}>
          <div style={{ maxWidth: "420px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              Jiddiy xatolik
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px", wordBreak: "break-word" }}>
              {error?.message || "Tizimda kutilmagan xato yuz berdi."}
            </p>
            {error?.digest && (
              <p style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace", marginBottom: "16px" }}>
                ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: "10px 20px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Qayta yuklash
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
