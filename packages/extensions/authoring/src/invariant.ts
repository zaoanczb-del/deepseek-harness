/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-authoring`.
 * @module @deepseek-ai/dsh-client-ui-authoring/invariant
 */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-authoring'

/** Cordis companion plugin name. */
export const name = 'client-ui-authoring-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the scoped provider and browser slot are registry-owned
 * registrations whose disposal is covered by focused lifecycle tests.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
