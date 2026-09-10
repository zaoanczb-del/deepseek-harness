import { useEffect, useState } from 'react'
import { Button, IconCodeOutline16, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type { SessionEventSource } from '@deepseek-ai/dsh-api-session-controller/client'
import { formatSessionLogData, formatSessionLogTime, sessionLogRows } from './session-log.ts'
import css from './SessionLogDialog.module.css'

/** Browser data source and history action for one Session log dialog. */
export interface SessionLogDialogInjected {
  hooks: { sessionEvents: SessionEventSource }
  loadOlder: () => Promise<void>
}

/** Full props for the Session-scoped authoring log entry. */
export type SessionLogDialogProps =
  PropsRuntime<'conversation.session.header.utilities'>
  & PropsLocale<'authoring'>
  & InjectFace<SessionLogDialogInjected>

/**
 * Render one Session event window in the authoring-owned modal.
 * @param props - Session-scoped UI hooks, localized labels, and dialog state.
 * @returns The modal containing the current Session event rows.
 */
export function SessionLogDialog({
  sessionId, useSession, useSessionEvents, loadOlder, open, onClose, t,
}: SessionLogDialogProps & { open: boolean; onClose: () => void }) {
  const eventWindow = useSessionEvents(snapshot => snapshot)
  const openState = useSession(snapshot => snapshot.openState)
  const openError = useSession(snapshot => snapshot.openError)
  const loadingOlder = useSession(snapshot => snapshot.loadingOlder)
  const rows = sessionLogRows(eventWindow.entries)
  const loading = openState === 'loading'
  const failed = openState === 'error'
  const description = t('log.description', { sessionId: String(sessionId) })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('log.title')}
      description={description}
      closeLabel={t('log.close')}
      className={css.dialog ?? ''}
      contentClassName={css.content ?? ''}
      footer={<Button variant="primary" onClick={onClose}>{t('log.close')}</Button>}
    >
      <div className={css.summary}>
        <span className={css.summaryText}>{t('log.count', { count: rows.length })}</span>
        {eventWindow.hasMore && (
          <Button size="sm" disabled={loadingOlder} onClick={() => { void loadOlder() }}>
            {loadingOlder ? t('log.loadingOlder') : t('log.loadOlder')}
          </Button>
        )}
      </div>
      {loading && <p className={css.status}>{t('log.loading')}</p>}
      {failed && (
        <p role="alert" className={`${css.status} ${css.statusError}`}>
          {openError?.message ?? t('log.loadFailed')}
        </p>
      )}
      {!loading && !failed && rows.length === 0 && <p className={css.empty}>{t('log.empty')}</p>}
      {rows.length > 0 && (
        <ol className={css.rows} aria-label={t('log.entriesLabel')}>
          {rows.map(row => (
            <li key={`${row.source}:${String(row.seq)}`} className={css.row}>
              <details className={css.details}>
                <summary className={css.rowSummary}>
                  <span className={css.rowSeq}>{row.seq}</span>
                  <span className={css.rowType} title={row.type}>
                    {row.type}
                    {row.source === 'chunks' && <span className={css.packed}>{t('log.packed')}</span>}
                  </span>
                  <span className={css.rowData} title={formatSessionLogData(row.data)}>
                    {formatSessionLogData(row.data)}
                  </span>
                  <span className={css.disclosure} aria-hidden="true" />
                </summary>
                <div className={css.detail}>
                  <div className={css.detailMeta}>
                    <span>{t('log.type')}</span>
                    <span>{row.type}</span>
                    <span>{t('log.seq', { seq: row.seq })}</span>
                    <span>{t('log.time', { time: formatSessionLogTime(row.time) })}</span>
                  </div>
                  <div className={css.detailData}>
                    <span>{t('log.data')}</span>
                    <pre className={css.dataValue}>{formatSessionLogData(row.data)}</pre>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  )
}

/**
 * Render the Header utility that opens the current Session log without a download.
 * @param props - Session-scoped UI hooks and localized labels.
 * @returns The header action and its Session log modal.
 */
export function SessionLogHeaderAction(props: SessionLogDialogProps) {
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(false) }, [props.sessionId])

  return (
    <>
      <button type="button" className={css.headerAction} onClick={() => { setOpen(true) }}>
        <span>{props.t('log.action')}</span>
        <IconCodeOutline16 size={12} />
      </button>
      <SessionLogDialog {...props} open={open} onClose={() => { setOpen(false) }} />
    </>
  )
}
