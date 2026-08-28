// @vitest-environment jsdom
/**
 * AuthoringModeSelect rendering and gestures: the trigger stays hidden until
 * the mode list resolves (or vanishes on failure/empty), the dialog opens with the default
 * authoring selection, and confirmation writes the natural-language `/skill` invocation over the existing draft; the trigger reflects the
 * fixed action label while the dialog reflects the draft's current selection, and leaving the plain
 * phase closes and disables.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { AuthoringModeSelect } from '../src/client/AuthoringModeSelect.tsx'
import type { AuthoringModeSelectProps } from '../src/client/AuthoringModeSelect.tsx'
import { zh } from '../src/client/locales.ts'
import { AUTHORING_SKILLS, AUTHORING_TYPES } from '../src/client/content.ts'
import { formatLessonVocabulary, vocabularyForLesson } from '../src/client/lesson-data.ts'

afterEach(cleanup)

const t = makeTranslate(zh)

function mount(options: {
  draft?: string
  phase?: string
  modes?: readonly string[]
  pending?: boolean
  fail?: boolean
} = {}) {
  const setDraft = vi.fn()
  const modes = options.modes ?? AUTHORING_SKILLS
  const listModes = options.pending === true
    ? () => new Promise<readonly string[]>(() => {})
    : options.fail === true
      ? (): Promise<readonly string[]> => Promise.reject(new Error('skill.list failed'))
      : (): Promise<readonly string[]> => Promise.resolve(modes)
  const props: AuthoringModeSelectProps = {
    sessionId: 's-1',
    input: { phase: options.phase ?? 'plain', draft: options.draft ?? '' },
    inputActions: { setDraft, submit: () => {} },
    listModes,
    t,
  } as AuthoringModeSelectProps
  const view = render(<AuthoringModeSelect {...props} />)
  const rerender = (input: { draft?: string; phase?: string }): void => {
    view.rerender(<AuthoringModeSelect
      {...{ ...props, input: { phase: input.phase ?? options.phase ?? 'plain', draft: input.draft ?? options.draft ?? '' } } as AuthoringModeSelectProps}
    />)
  }
  return { view, setDraft, rerender }
}

const trigger = (): HTMLElement => screen.getByRole('button', { name: '选择内容' })

function lessonPrompt(type: string, grade: string, lesson: number): string {
  const typeEntry = AUTHORING_TYPES.find(candidate => candidate.label === type)
  const gradeEntry = typeEntry?.kind === 'lesson'
    ? typeEntry.grades.find(candidate => candidate.label === grade)
    : undefined
  if (gradeEntry === undefined) throw new Error(`missing test grade ${grade}`)
  const vocabulary = vocabularyForLesson(gradeEntry, lesson)
  if (vocabulary === undefined) throw new Error(`missing test lesson ${grade} ${String(lesson)}`)
  return formatLessonVocabulary(lesson, vocabulary)
}

function generatedPrompt(mode: 'story' | 'practice', type: string, grade: string, lesson: number): string {
  const lessonText = lessonPrompt(type, grade, lesson)
  const vocabularyLines = lessonText.slice(lessonText.indexOf('\n') + 1)
  const content = mode === 'story' ? '故事' : '练习题'
  return `/${mode} 帮我编写 ${grade}年级第一课的${content}\n${vocabularyLines}`
}

function practicePrompt(type: string, practice: string, skill: string, grade: string, lesson: number): string {
  const lessonText = lessonPrompt(type, grade, lesson)
  const lines = lessonText.split('\n')
  return [
    `/${skill} 生成内容：${practice}`,
    `年级：${grade}`,
    `课次：${String(lesson)}`,
    lines[1]?.replace(/^本课生字/, '生字'),
    lines[2]?.replace(/^本课生词/, '词语'),
  ].join('\n')
}

describe('AuthoringModeSelect', () => {
  it('renders nothing while the mode list is pending', () => {
    const { view } = mount({ pending: true })
    expect(view.container.firstChild).toBeNull()
  })

  it('renders nothing when the mode list fails', async () => {
    const { view } = mount({ fail: true })
    await waitFor(() => { expect(view.container.firstChild).toBeNull() })
  })

  it('renders nothing when the preset provides no authoring skill', async () => {
    const { view } = mount({ modes: [] })
    await waitFor(() => { expect(view.container.firstChild).toBeNull() })
  })

  it('defaults to the screenshot selection when the dialog opens', async () => {
    mount()
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeDefined()
    expect(screen.getAllByRole('radio').length).toBeGreaterThan(0)
    const confirm = screen.getByRole('button', { name: '确定' })
    expect(screen.getByRole('radio', { name: /新朋友/ }).getAttribute('aria-checked'))
      .toBe('true')
    expect(screen.getByRole('radio', { name: /编写故事/ }).getAttribute('aria-checked'))
      .toBe('true')
    expect(screen.getByRole('heading', { name: '生成内容' })).toBeDefined()
    expect(screen.getByRole('heading', { name: '年级' })).toBeDefined()
    expect(screen.getByRole('radio', { name: 'P1' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: 'P1高' })).toBeDefined()
    expect(screen.getByRole('radio', { name: 'P2' })).toBeDefined()
    expect(screen.getByRole('radio', { name: 'P2高' })).toBeDefined()
    expect(screen.getByRole('radio', { name: '1' }).getAttribute('aria-checked')).toBe('true')
    expect(confirm.getAttribute('disabled')).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: 'P1高' }))
    expect(screen.getByRole('heading', { name: '课次' })).toBeDefined()
    expect(confirm.getAttribute('disabled')).not.toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: '1' }))
    expect(confirm.getAttribute('disabled')).toBeNull()
  })

  it('shows the grades belonging to the selected content type', async () => {
    mount()
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('radio', { name: /新天地/ }))
    expect(screen.getByRole('radio', { name: 'P3' })).toBeDefined()
    expect(screen.getByRole('radio', { name: 'P3高' })).toBeDefined()
    expect(screen.getByRole('radio', { name: 'P4' })).toBeDefined()
    expect(screen.getByRole('radio', { name: 'P4高' })).toBeDefined()
    expect(screen.queryByRole('radio', { name: 'P1' })).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: 'P3' }))
    expect(screen.getByRole('radio', { name: '1' })).toBeDefined()
    expect(screen.getByRole('radio', { name: '17' })).toBeDefined()
  })

  it('defaults grade, lesson, and practice type when the lesson type changes', async () => {
    mount()
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('radio', { name: /新列车/ }))
    expect(screen.getByRole('radio', { name: /编写故事/ }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: 'P5' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: /^1$/ }).getAttribute('aria-checked')).toBe('true')

    fireEvent.click(screen.getByRole('radio', { name: /练习题/ }))
    expect(screen.getByRole('radio', { name: '填写汉字' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: 'P5' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: /^1$/ }).getAttribute('aria-checked')).toBe('true')
  })

  it('offers every LangMind practice type for each textbook range', async () => {
    mount()
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('radio', { name: /练习题/ }))
    expect(screen.getByRole('heading', { name: '练习类型' })).toBeDefined()
    expect(screen.getByRole('radio', { name: '选拼音' })).toBeDefined()
    expect(screen.getByRole('radio', { name: '辨字测验' })).toBeDefined()
    expect(screen.getByRole('radio', { name: '拼音选择' })).toBeDefined()
    expect(screen.queryByRole('radio', { name: '词义选择' })).toBeNull()
    expect(screen.queryByRole('radio', { name: '词语搭配' })).toBeNull()

    fireEvent.click(screen.getByRole('radio', { name: /新天地/ }))
    fireEvent.click(screen.getByRole('radio', { name: /练习题/ }))
    expect(screen.getByRole('radio', { name: '词义选择' })).toBeDefined()
    expect(screen.getByRole('radio', { name: '词语搭配' })).toBeDefined()
    expect(screen.queryByRole('radio', { name: '选拼音' })).toBeNull()

    fireEvent.click(screen.getByRole('radio', { name: /新列车/ }))
    fireEvent.click(screen.getByRole('radio', { name: /练习题/ }))
    expect(screen.getByRole('radio', { name: '词义选择' })).toBeDefined()
    expect(screen.queryByRole('radio', { name: '词语搭配' })).toBeNull()
    expect(screen.getByRole('radio', { name: '拼音选择' })).toBeDefined()
  })

  it('filters grades by practice type and writes its dedicated invocation', async () => {
    const { setDraft } = mount()
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('radio', { name: /练习题/ }))
    fireEvent.click(screen.getByRole('radio', { name: '辨字测验' }))
    expect(screen.queryByRole('radio', { name: 'P1' })).toBeNull()
    expect(screen.queryByRole('radio', { name: 'P1高' })).toBeNull()
    expect(screen.getByRole('radio', { name: 'P2' })).toBeDefined()
    expect(screen.getByRole('radio', { name: 'P2高' })).toBeDefined()
    fireEvent.click(screen.getByRole('radio', { name: 'P2' }))
    fireEvent.click(screen.getByRole('radio', { name: /^1$/ }))
    fireEvent.click(screen.getByRole('button', { name: '确定' }))
    const lessonText = lessonPrompt('新朋友', 'P2', 1).split('\n')
    expect(setDraft).toHaveBeenCalledWith([
      '/practice-bian-zi-ce-yan 生成内容：辨字测验',
      '年级：P2',
      '课次：1',
      lessonText[1]?.replace(/^本课生字/, '生字'),
    ].join('\n'))
  })

  it('restores a dedicated practice selection from the draft', async () => {
    mount({
      draft: practicePrompt('新天地', '填写汉字', 'practice-tian-xie-han-zi', 'P3', 1),
    })
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    expect(screen.getByRole('radio', { name: /新天地/ }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: /练习题/ }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: '填写汉字' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: 'P3' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: /^1$/ }).getAttribute('aria-checked')).toBe('true')
  })

  it('writes the invocation and closes on confirm', async () => {
    const { setDraft } = mount()
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('radio', { name: /新朋友/ }))
    fireEvent.click(screen.getByRole('radio', { name: /编写故事/ }))
    fireEvent.click(screen.getByRole('radio', { name: 'P2' }))
    fireEvent.click(screen.getByRole('radio', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: '确定' }))
    expect(setDraft).toHaveBeenCalledWith(generatedPrompt('story', '新朋友', 'P2', 1))
    await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull() })
  })

  it('uses the Knowledge Pictorial sub-options without grade or lesson', async () => {
    const { setDraft } = mount({ draft: '写一个月球故事' })
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('radio', { name: /知识画报/ }))
    expect(screen.getByRole('radio', { name: '故事园地' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('heading', { name: '故事类型' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: '年级' })).toBeNull()
    expect(screen.queryByRole('heading', { name: '课次' })).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: '动物寓言' }))
    fireEvent.click(screen.getByRole('button', { name: '确定' }))
    expect(setDraft).toHaveBeenCalledWith(
      '/knowledge-pictorial-story 请编写一篇“动物寓言”的故事\n故事主题：分享精神\n写一个月球故事',
    )
  })

  it('restores the publication selection from the draft', async () => {
    mount({
      draft: '/knowledge-pictorial-story 请编写一篇“动物寓言”的故事\n故事主题：分享精神',
    })
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(screen.getByRole('button', { name: '选择内容' }))
    expect(screen.getByRole('radio', { name: /知识画报/ }).getAttribute('aria-checked'))
      .toBe('true')
    expect(screen.getByRole('radio', { name: '故事园地' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: '动物寓言' }).getAttribute('aria-checked')).toBe('true')
  })

  it('offers both Good Friend generation choices', async () => {
    const { setDraft } = mount()
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('radio', { name: /好朋友/ }))
    expect(screen.getByRole('radio', { name: '欢乐故事' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: '欢乐儿童' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: '年级' })).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: '欢乐儿童' }))
    fireEvent.click(screen.getByRole('button', { name: '确定' }))
    expect(setDraft).toHaveBeenCalledWith(
      '/good-friend-happy-kids 请以「团结合作」为主题，主角是小熊，写一个关于学校运动会的故事。',
    )
  })

  it('uses Story Space directly for Knowledge News', async () => {
    const { setDraft } = mount()
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('radio', { name: /知识报/ }))
    expect(screen.getByRole('radio', { name: '故事空间' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.queryByRole('heading', { name: '故事类型' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '确定' }))
    expect(setDraft).toHaveBeenCalledWith(
      '/knowledge-news-story 请写一篇关于“分享”主题的故事，主角是两个小学生。',
    )
  })

  it('shows the skill alone when the draft names no bundled type', async () => {
    mount({ draft: '/story 写一个月球故事' })
    await screen.findByRole('button', { name: '选择内容' })
  })

  it('disables skills the preset does not provide', async () => {
    const { setDraft } = mount({ modes: ['story'] })
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    expect(screen.getByRole('radio', { name: /练习题/ }).getAttribute('disabled')).not.toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: /新天地/ }))
    fireEvent.click(screen.getByRole('radio', { name: /编写故事/ }))
    fireEvent.click(screen.getByRole('radio', { name: 'P3' }))
    fireEvent.click(screen.getByRole('radio', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: '确定' }))
    expect(setDraft).toHaveBeenCalledWith(generatedPrompt('story', '新天地', 'P3', 1))
  })

  it('closes without writing on cancel', async () => {
    const { setDraft } = mount()
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('radio', { name: /新朋友/ }))
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull() })
    expect(setDraft).not.toHaveBeenCalled()
  })

  it('closes the dialog when the input leaves the plain phase', async () => {
    const { rerender } = mount()
    await screen.findByRole('button', { name: '选择内容' })
    fireEvent.click(trigger())
    expect(screen.getByRole('dialog')).toBeDefined()
    rerender({ phase: 'claimed' })
    await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull() })
  })

  it('disables the trigger outside the plain phase', async () => {
    mount({ phase: 'claimed' })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '选择内容' }).getAttribute('disabled')).not.toBeNull()
    })
  })
})
