/**
 * Placeholder for export job tracking. Wire to backend export endpoints when ready.
 */

export type ExportStatus = "idle" | "pending" | "done" | "error"

export function useExportStatus(_jobId?: string | null) {
  return { status: "idle" as ExportStatus, progress: 0, downloadUrl: null as string | null }
}
