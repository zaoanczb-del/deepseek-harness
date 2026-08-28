/** Authoring selector browser half. */
import type { SessionId, SkillEntry } from '@deepseek-ai/dsh-api-remotes/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { AuthoringModeSelect } from './AuthoringModeSelect.tsx'
import { AUTHORING_SKILLS } from './content.ts'
import type { AuthoringMode } from './draft.ts'
import { en, NS, zh, type AuthoringKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Composer authoring selector copy. */
    authoring: AuthoringKey
  }
}

/** Business operations injected into the authoring selector. */
export interface AuthoringModeInjected {
  /** List plugin-owned modes available to one session's active preset. */
  listModes: (sessionId: SessionId, signal: AbortSignal) => Promise<readonly AuthoringMode[]>
}

/** Required browser services. */
export const inject = ['slots', 'locale', 'remote', 'remote.skills']

/** Register locale dictionaries and append the selector to input.left. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'authoring: dictionaries')
  const skills = ctx.remote.skills
  const listModes: AuthoringModeInjected['listModes'] = async (sessionId, signal) => {
    const result = await skills.list({ sessionId }, signal)
    if (!result.ok) throw new Error(`skill.list failed: ${result.error.code}: ${result.error.message}`)
    const names = new Set(result.value.skills.map((skill: SkillEntry) => skill.name))
    return AUTHORING_SKILLS.filter(mode => names.has(mode))
  }
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'authoring-mode',
    order: 0,
    locale: NS,
    inject: (): AuthoringModeInjected => ({ listModes }),
  }, AuthoringModeSelect))
}

export type { AuthoringMode } from './draft.ts'
