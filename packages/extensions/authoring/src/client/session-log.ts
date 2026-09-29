import type { SessionEventLikeEntry } from '@deepseek-ai/dsh-api-session-controller/client'

/** One event-window entry reduced to the fields shown by the Session log viewer. */
export interface SessionLogRow {
  readonly source: SessionEventLikeEntry['type']
  readonly type: string
  readonly seq: number
  readonly time: number
  readonly data: unknown
}

/**
 * Project transport entries into the stable raw fields shown in the viewer.
 * @param entries - current contiguous Session event window.
 * @returns rows in the source order, which is ascending by Session sequence.
 */
export function sessionLogRows(entries: readonly SessionEventLikeEntry[]): readonly SessionLogRow[] {
  return entries.map(entry => ({
    source: entry.type,
    type: entry.event.type,
    seq: entry.event.seq,
    time: entry.event.time,
    data: entry.event.data,
  }))
}

/**
 * Format a raw event timestamp without hiding its Unix millisecond value.
 * @param time - Unix timestamp in milliseconds.
 * @returns The raw timestamp followed by its ISO representation.
 */
export function formatSessionLogTime(time: number): string {
  const iso = new Date(time).toISOString()
  return `${String(time)} (${iso})`
}

/**
 * Format one JSON event payload for the read-only detail block.
 * @param data - Event payload to render.
 * @returns Pretty-printed JSON, or the string representation for non-JSON values.
 */
export function formatSessionLogData(data: unknown): string {
  return JSON.stringify(data, null, 2)
}
