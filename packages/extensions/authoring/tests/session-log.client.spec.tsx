// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSyncExternalStore } from 'react'
import {
  MutableSessionEventSource,
  type SessionEventLikeEntry,
} from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SessionSnapshot } from '@deepseek-ai/dsh-api-session-controller/client'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { SessionLogHeaderAction } from '../src/client/SessionLogDialog.tsx'
import type { SessionLogDialogProps } from '../src/client/SessionLogDialog.tsx'
import { formatSessionLogTime, sessionLogRows } from '../src/client/session-log.ts'
import { zh } from '../src/client/locales.ts'

const SID = 'authoring-session-log' as SessionId
const t = makeTranslate(zh)

interface SnapshotSource<T> {
  getSnapshot: () => T
  subscribe: (listener: () => void) => () => void
}

function sessionSnapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    sessionId: SID,
    queue: [],
    pendingSubmissions: [],
    running: false,
    subagent: null,
    removed: false,
    openState: 'open',
    openError: null,
    hasMore: false,
    loadingOlder: false,
    promptError: null,
    blank: false,
    lastAgentError: null,
    promptAttempted: false,
    awaitingFirstTurn: false,
    ...overrides,
  }
}

function selectorHook<T>(source: SnapshotSource<T>) {
  return function useSelected<S>(select: (snapshot: T) => S): S {
    return useSyncExternalStore(
      listener => source.subscribe(listener),
      () => select(source.getSnapshot()),
      () => select(source.getSnapshot()),
    )
  }
}

function mutableSource<T>(initial: T): SnapshotSource<T> & { set(value: T): void } {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => value,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    set: (next) => {
      value = next
      for (const listener of listeners) listener()
    },
  }
}

function event(type: string, seq: number, data: unknown, time = 1): SessionEventLikeEntry {
  return {
    type: 'event',
    event: { type, seq, time, data } as never,
  }
}

function mount(options: {
  entries?: readonly SessionEventLikeEntry[]
  hasMore?: boolean
  loadOlder?: () => Promise<void>
} = {}) {
  const events = new MutableSessionEventSource()
  events.replace(options.entries ?? [event('turn/start', 1, { turn: 1 }, 1)], options.hasMore ?? false)
  const session = mutableSource(sessionSnapshot({ hasMore: options.hasMore ?? false }))
  const loadOlder = options.loadOlder ?? vi.fn(async () => {})
  const props = {
    sessionId: SID,
    useSession: selectorHook(session),
    useSessionEvents: selectorHook(events),
    loadOlder,
    t,
  } as unknown as SessionLogDialogProps
  const view = render(<SessionLogHeaderAction {...props} />)
  return { events, loadOlder, session, view }
}

afterEach(cleanup)

describe('Session log projection', () => {
  it('projects ordinary and transient entries without changing their raw fields', () => {
    const entries: SessionEventLikeEntry[] = [
      event('turn/start', 3, { turn: 1 }, 10),
      {
        type: 'transient',
        event: { type: 'chunkrow/text', seq: 4, time: 11, data: { text: 'hi' } } as never,
      },
    ]

    expect(sessionLogRows(entries)).toEqual([
      { source: 'event', type: 'turn/start', seq: 3, time: 10, data: { turn: 1 } },
      { source: 'transient', type: 'chunkrow/text', seq: 4, time: 11, data: { text: 'hi' } },
    ])
    expect(formatSessionLogTime(10)).toBe('10 (1970-01-01T00:00:00.010Z)')
  })

  it('opens from the Header utility and renders type, sequence, time, and expandable data', () => {
    mount({ entries: [event('turn/start', 7, { turn: 2 }, 1_700_000_000_000)] })
    fireEvent.click(screen.getByRole('button', { name: 'Session 日志' }))

    const dialog = screen.getByRole('dialog', { name: 'Session 日志' })
    const row = screen.getByRole('listitem')
    const summary = row.querySelector('summary')
    if (summary === null) throw new Error('Session log row has no disclosure summary')
    const details = summary.closest('details')
    if (details === null) throw new Error('Session log row has no details element')
    expect(summary.textContent).toContain('7')
    expect(summary.textContent).not.toContain('seq')
    expect(summary.textContent).toContain('turn/start')
    expect(summary.textContent).toContain('"turn": 2')
    expect(details.open).toBe(false)
    fireEvent.click(summary)
    expect(details.open).toBe(true)
    expect(dialog.textContent).toContain('seq 7')
    expect(dialog.textContent).toContain('time 1700000000000')
    expect(dialog.textContent).toContain('"turn": 2')
  })

  it('updates live and delegates older-history paging to the Session face', async () => {
    const loadOlder = vi.fn(async () => {})
    const b = mount({ hasMore: true, loadOlder })
    fireEvent.click(screen.getByRole('button', { name: 'Session 日志' }))
    expect(screen.getByRole('button', { name: '加载更早日志' })).toBeDefined()

    act(() => { b.events.append(event('turn/end', 2, { reason: 'done' }) as never) })
    expect(screen.getAllByText('turn/end').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: '加载更早日志' }))
    await waitFor(() => { expect(loadOlder).toHaveBeenCalledOnce() })
  })

  it('closes when the Session identity changes', async () => {
    const b = mount()
    fireEvent.click(screen.getByRole('button', { name: 'Session 日志' }))
    expect(screen.getByRole('dialog', { name: 'Session 日志' })).toBeDefined()
    b.view.rerender(<SessionLogHeaderAction {...({
      sessionId: 'other-session' as SessionId,
      useSession: selectorHook(b.session),
      useSessionEvents: selectorHook(b.events),
      loadOlder: b.loadOlder,
      t,
    } as unknown as SessionLogDialogProps)} />)
    await waitFor(() => { expect(screen.queryByRole('dialog', { name: 'Session 日志' })).toBeNull() })
  })
})
