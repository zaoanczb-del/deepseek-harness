import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import SkillRegistry from '@deepseek-ai/dsh-skill'
import * as Authoring from '../src/index.ts'

describe('authoring host plugin', () => {
  it('mounts its bundled skills through an injected provider child', async () => {
    const ctx = new Context()
    await ctx.plugin(SkillRegistry)

    const fiber = ctx.plugin(Authoring, { registerBundledSkills: true })
    await fiber.await()

    expect((await ctx.skills.list()).map(skill => skill.name)).toEqual([
      'good-friend-happy-kids',
      'good-friend-story',
      'knowledge-news-story',
      'knowledge-pictorial-story',
      'practice',
      'practice-bian-zi-ce-yan',
      'practice-ci-yi-xuan-ze',
      'practice-ci-yu-da-pei',
      'practice-ci-yu-xuan-ze',
      'practice-ju-zi-xuan-ze',
      'practice-pei-ci',
      'practice-pin-ying-xuan-ze',
      'practice-shu-bi-hua',
      'practice-tian-xie-han-zi',
      'practice-tian-xie-pin-yin',
      'practice-wan-cheng-ju-zi',
      'practice-xuan-pin-ying',
      'practice-xuan-ze-yin-jie',
      'practice-zu-ci-cheng-ju',
      'story',
    ])
    await fiber.dispose()
    expect(await ctx.skills.list()).toEqual([])
  })

  it('loads as a browser-only host entry without a skill registry', async () => {
    const ctx = new Context()
    const fiber = ctx.plugin(Authoring, { registerBundledSkills: false })
    await fiber.await()
    await fiber.dispose()
  })
})
