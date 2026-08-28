/**
 * Authoring plugin host half: optionally mounts the bundled textbook story, synchronous-practice,
 * and publication skills into the current agent-preset scope. The Web bundle loads the same
 * package with registration disabled only to discover its browser half.
 *
 * @module @deepseek-ai/dsh-client-ui-authoring
 */
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type Schema from '@deepseek-ai/schemastery'
import * as SkillFilesystem from '@deepseek-ai/dsh-skill-filesystem'

/** Host-side authoring plugin configuration. */
export interface Config {
  /** Whether this scope receives the plugin's bundled skills. */
  registerBundledSkills?: boolean
}

/** Validated authoring plugin configuration. */
export const Config: Schema<Config> = z.object({
  registerBundledSkills: z.boolean().default(true),
})

/** Register the plugin-owned skill directory in the current preset scope. */
export function apply(ctx: Context, config: Config = {}): void {
  if (config.registerBundledSkills === false) return
  ctx.plugin(SkillFilesystem, {
    providerName: 'authoring',
    includeDefaultRoots: false,
    bundledSkillDir: fileURLToPath(new URL('../skills/', import.meta.url)),
    watch: false,
  })
}
