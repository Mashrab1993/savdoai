/**
 * WebSocket client placeholder for live updates.
 * Wire to FastAPI WS endpoint when backend is ready.
 */

export type WsMessage = { type: string; payload?: unknown }

export function createWsClient(_url: string): {
  subscribe: (cb: (msg: WsMessage) => void) => () => void
  close: () => void
} {
  return {
    subscribe: () => () => {},
    close: () => {},
  }
}
