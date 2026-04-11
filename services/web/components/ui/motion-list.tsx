"use client"

import { motion, type Variants } from "framer-motion"
import type { ReactNode } from "react"

/**
 * Staggered entrance animation for lists (table rows, card grids).
 *
 * Usage:
 *   <MotionList>
 *     {items.map(it => <MotionItem key={it.id}>{...}</MotionItem>)}
 *   </MotionList>
 */

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show:   {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
}

export function MotionList({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode
  className?: string
  as?: "div" | "tbody" | "ul"
}) {
  const MotionAs = motion[As] as any
  return (
    <MotionAs
      initial="hidden"
      animate="show"
      variants={listVariants}
      className={className}
    >
      {children}
    </MotionAs>
  )
}

export function MotionItem({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode
  className?: string
  as?: "div" | "tr" | "li"
}) {
  const MotionAs = motion[As] as any
  return (
    <MotionAs variants={itemVariants} className={className}>
      {children}
    </MotionAs>
  )
}
