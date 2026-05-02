"use client"
import { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AdminLayout } from "@/components/layout/admin-layout"

type Props = {
  /** Breadcrumb back link */
  backLink?: { href: string; label: string }
  /** Hero title - first part */
  title: string
  /** Hero title - italic terracotta accent part */
  accent?: string
  /** Description below title */
  description?: string
  /** Right side actions */
  actions?: ReactNode
  children: ReactNode
}

/**
 * Premium Anthropic-style page wrapper.
 * Provides warm cream background, hero header with serif italic accent,
 * and consistent spacing across all premium-styled pages.
 */
export function PremiumPage({ backLink, title, accent, description, actions, children }: Props) {
  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero header */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              {backLink && (
                <Link
                  href={backLink.href}
                  className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium hover:text-[#C75D3C] flex items-center gap-2 mb-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> {backLink.label}
                </Link>
              )}
              <h1
                className="text-5xl font-light tracking-tight text-[#1A1A1A]"
                style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}
              >
                {title}
                {accent && <> <span className="italic text-[#C75D3C]">{accent}</span></>}
              </h1>
              {description && (
                <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">{description}</p>
              )}
            </div>
            {actions && <div className="flex gap-2 items-center">{actions}</div>}
          </div>

          {/* Content */}
          {children}
        </div>
      </div>
    </AdminLayout>
  )
}

/**
 * Premium card with cream background, soft border, subtle shadow.
 */
export function PremiumCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#E8E0D3] shadow-sm rounded-2xl ${className}`}>
      {children}
    </div>
  )
}

/**
 * Section heading with cream uppercase eyebrow + serif title.
 */
export function PremiumSectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        {eyebrow && (
          <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">{eyebrow}</div>
        )}
        <h2 className="text-2xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}

/**
 * Status badge with Anthropic palette.
 */
export function PremiumBadge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "success" | "warning" | "info" }) {
  const variants = {
    default: "bg-[#E8E0D3] text-[#1A1A1A]",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-[#F5E5D6] text-[#C75D3C]",
    info: "bg-blue-50 text-blue-700",
  }
  return (
    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

/**
 * Premium button with terracotta accent.
 */
export function PremiumButton({ children, onClick, variant = "primary" }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "outline" }) {
  const styles = variant === "primary"
    ? "bg-[#C75D3C] text-white hover:bg-[#A84A2D]"
    : "bg-white border border-[#E8E0D3] text-[#1A1A1A] hover:border-[#C75D3C]"
  return (
    <button onClick={onClick} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${styles}`}>
      {children}
    </button>
  )
}
