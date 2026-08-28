import { describe, expect, it } from 'vitest'
import {
  applyAuthoringMode,
  applyPracticeAuthoring,
  applyPublicationAuthoring,
  readAuthoringMode,
} from '../src/client/draft.ts'
import { AUTHORING_TYPES, PRACTICE_TYPES } from '../src/client/content.ts'
import { formatLessonVocabulary, vocabularyForLesson, type LessonVocabulary } from '../src/client/lesson-data.ts'

const vocabulary: LessonVocabulary = { characters: ['月', '球'], words: ['月球'] }
const prompt = '第1课\n本课生字：月、球\n本课生词：月球'
const vocabularyLines = prompt.slice(prompt.indexOf('\n') + 1)

describe('authoring draft mapping', () => {
  it('adds a natural story prompt before an existing prompt', () => {
    expect(applyAuthoringMode('写一个月球故事', 'story', 'P1', 1, vocabulary))
      .toBe(`/story 帮我编写 P1年级第一课的故事\n${vocabularyLines}\n写一个月球故事`)
  })

  it('composes the natural practice prompt alone for an empty draft', () => {
    expect(applyAuthoringMode('', 'practice', 'P4', 1, vocabulary))
      .toBe(`/practice 帮我编写 P4年级第一课的练习题\n${vocabularyLines}`)
  })

  it('replaces a previous natural prompt without changing the prompt tail', () => {
    expect(applyAuthoringMode(`/story 帮我编写 P2年级第二课的故事\n${vocabularyLines}\n续写`, 'practice', 'P3高', 1, vocabulary))
      .toBe(`/practice 帮我编写 P3高年级第一课的练习题\n${vocabularyLines}\n续写`)
  })

  it('keeps the user prompt when the previous invocation has no lesson block', () => {
    expect(applyAuthoringMode('/story 新朋友 P1', 'story', 'P1', 1, vocabulary))
      .toBe(`/story 帮我编写 P1年级第一课的故事\n${vocabularyLines}`)
  })

  it('replaces a previous generated lesson block while preserving the tail', () => {
    const previousType = AUTHORING_TYPES[0]
    const previousGrade = previousType?.kind === 'lesson' ? previousType.grades[0] : undefined
    if (previousGrade === undefined) throw new Error('missing previous test grade')
    const previousVocabulary = vocabularyForLesson(previousGrade, 1)
    if (previousVocabulary === undefined) throw new Error('missing previous test lesson')
    const previousPrompt = formatLessonVocabulary(1, previousVocabulary)
    expect(applyAuthoringMode(`/story 新朋友 P1 第1课\n${previousPrompt.slice(previousPrompt.indexOf('\n') + 1)}\n续写`, 'practice', 'P2', 1, vocabulary))
      .toBe(`/practice 帮我编写 P2年级第一课的练习题\n${vocabularyLines}\n续写`)
  })

  it('treats an unrecognized token after the skill as prompt, not type', () => {
    expect(applyAuthoringMode('/story 写一个月球故事', 'practice', 'P2', 1, vocabulary))
      .toBe(`/practice 帮我编写 P2年级第一课的练习题\n${vocabularyLines}\n写一个月球故事`)
  })

  it('treats an unsupported grade after a recognized type as prompt text', () => {
    expect(applyAuthoringMode('/story 新天地 P1 写故事', 'practice', 'P2高', 1, vocabulary))
      .toBe(`/practice 帮我编写 P2高年级第一课的练习题\n${vocabularyLines}\nP1 写故事`)
  })

  it('uses Chinese lesson numbers in the generated prompt', () => {
    expect(applyAuthoringMode('', 'story', 'P1', 10, vocabulary))
      .toBe(`/story 帮我编写 P1年级第十课的故事\n${vocabularyLines}`)
    expect(applyAuthoringMode('', 'story', 'P1', 21, vocabulary))
      .toBe(`/story 帮我编写 P1年级第二十一课的故事\n${vocabularyLines}`)
  })

  it('recognizes only a whitespace-bounded leading authoring token', () => {
    expect(readAuthoringMode('/practice\n根据材料出题'))
      .toEqual({
        mode: 'practice',
        type: undefined,
        content: undefined,
        storyKind: undefined,
        grade: undefined,
        lesson: undefined,
      })
    expect(readAuthoringMode('请使用 /story')).toBeUndefined()
    expect(readAuthoringMode('/storyboard')).toBeUndefined()
  })

  it('reads the type, offered grade, and lesson', () => {
    expect(readAuthoringMode('/story 新朋友 P1高 第12课'))
      .toEqual({
        mode: 'story',
        type: '新朋友',
        content: undefined,
        storyKind: undefined,
        grade: 'P1高',
        lesson: 12,
      })
    expect(readAuthoringMode('/story 新天地 P1'))
      .toEqual({
        mode: 'story',
        type: '新天地',
        content: undefined,
        storyKind: undefined,
        grade: undefined,
        lesson: undefined,
      })
    expect(readAuthoringMode('/story 写一个月球故事'))
      .toEqual({
        mode: 'story',
        type: undefined,
        content: undefined,
        storyKind: undefined,
        grade: undefined,
        lesson: undefined,
      })
  })

  it('maps publication choices to their dedicated skill prompts', () => {
    const goodFriend = AUTHORING_TYPES.find(candidate => candidate.label === '好朋友')
    const pictorial = AUTHORING_TYPES.find(candidate => candidate.label === '知识画报')
    if (goodFriend?.kind !== 'publication' || pictorial?.kind !== 'publication') {
      throw new Error('missing publication test types')
    }
    expect(applyPublicationAuthoring('', goodFriend, '欢乐儿童'))
      .toBe('/good-friend-happy-kids 请以「团结合作」为主题，主角是小熊，写一个关于学校运动会的故事。')
    expect(applyPublicationAuthoring('补充海边场景', pictorial, '故事园地', '动物寓言'))
      .toBe('/knowledge-pictorial-story 请编写一篇“动物寓言”的故事\n故事主题：分享精神\n补充海边场景')
  })

  it('maps every practice vocabulary source to the LangMind draft fields', () => {
    const characters = PRACTICE_TYPES.find(candidate => candidate.label === '辨字测验')
    const words = PRACTICE_TYPES.find(candidate => candidate.label === '词语选择')
    const both = PRACTICE_TYPES.find(candidate => candidate.label === '填写汉字')
    const newFriend = AUTHORING_TYPES.find(candidate => candidate.label === '新朋友')
    if (characters === undefined || words === undefined || both === undefined || newFriend?.kind !== 'lesson') {
      throw new Error('missing practice draft fixture')
    }
    const grade = newFriend.grades.find(candidate => candidate.label === 'P2')
    if (grade === undefined) throw new Error('missing P2 grade')
    expect(applyPracticeAuthoring('', characters, grade, 1, vocabulary))
      .toBe('/practice-bian-zi-ce-yan 生成内容：辨字测验\n年级：P2\n课次：1\n生字：月、球')
    expect(applyPracticeAuthoring('', words, grade, 1, vocabulary))
      .toBe('/practice-ci-yu-xuan-ze 生成内容：词语选择\n年级：P2\n课次：1\n词语：月球')
    expect(applyPracticeAuthoring('', both, grade, 1, vocabulary))
      .toBe('/practice-tian-xie-han-zi 生成内容：填写汉字\n年级：P2\n课次：1\n生字：月、球\n词语：月球')
  })

  it('restores and replaces a dedicated practice prompt without losing user text', () => {
    const practice = PRACTICE_TYPES.find(candidate => candidate.label === '填写汉字')
    const newWorld = AUTHORING_TYPES.find(candidate => candidate.label === '新天地')
    if (practice === undefined || newWorld?.kind !== 'lesson') throw new Error('missing practice restore fixture')
    const grade = newWorld.grades.find(candidate => candidate.label === 'P3')
    if (grade === undefined) throw new Error('missing P3 grade')
    const draft = '/practice-tian-xie-han-zi 生成内容：填写汉字\n年级：P3\n课次：4\n生字：月、球\n词语：月球\n再出两题'
    expect(readAuthoringMode(draft)).toEqual({
      mode: 'practice-tian-xie-han-zi',
      type: '新天地',
      content: '同步练习题',
      storyKind: undefined,
      practiceType: '填写汉字',
      grade: 'P3',
      lesson: 4,
    })
    expect(applyPracticeAuthoring(draft, practice, grade, 2, vocabulary))
      .toBe('/practice-tian-xie-han-zi 生成内容：填写汉字\n年级：P3\n课次：2\n生字：月、球\n词语：月球\n再出两题')
  })

  it('restores a publication and its story kind from the draft', () => {
    expect(readAuthoringMode('/knowledge-pictorial-story 请编写一篇“动物寓言”的故事\n故事主题：分享精神'))
      .toEqual({
        mode: 'knowledge-pictorial-story',
        type: '知识画报',
        content: '故事园地',
        storyKind: '动物寓言',
        grade: undefined,
        lesson: undefined,
      })
  })

  it('replaces a publication prompt with a lesson prompt while preserving user text', () => {
    expect(applyAuthoringMode(
      '/knowledge-news-story 请写一篇关于“分享”主题的故事，主角是两个小学生。\n改成校园场景',
      'story',
      'P5',
      1,
      vocabulary,
    )).toBe(`/story 帮我编写 P5年级第一课的故事\n${vocabularyLines}\n改成校园场景`)
  })
})
