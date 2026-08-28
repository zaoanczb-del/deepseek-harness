import {
  AUTHORING_SKILLS,
  AUTHORING_TYPES,
  findPracticeType,
  findAuthoringType,
  type AuthoringSkill,
  type AuthoringGrade,
  type LessonAuthoringType,
  type PracticeTypeOption,
  type PublicationAuthoringSkill,
  type PublicationAuthoringType,
} from './content.ts'
import { formatLessonVocabulary, vocabularyForLesson, type LessonVocabulary } from './lesson-data.ts'

/** Authoring modes represented by bundled, user-invocable skills. */
export type AuthoringMode = AuthoringSkill

const SKILL_PATTERN = AUTHORING_SKILLS.join('|')
/** A leading invocation token owned by this plugin. */
const MODE_PREFIX = new RegExp(`^/(${SKILL_PATTERN})(?=\\s|$)`)
/** The optional content-type token right after the generic mode token. */
const TYPE_TOKEN = /^[ \t]+([^\s/]+)/
/** The optional grade token right after a recognized content type. */
const GRADE_TOKEN = /^[ \t]+([^\s/]+)/
/** The optional lesson token after a recognized grade. */
const LESSON_TOKEN = /^[ \t]+第([1-9]\d*)课(?=\s|$)/
/** A generated natural-language lesson prompt that can be replaced on reselection. */
const NATURAL_PROMPT = /^[ \t]+帮我编写[ \t]+P[1-6](?:高)?年级第[一二三四五六七八九十百]+课的(?:故事|练习题)(?=\s|$)/
/** Vocabulary lines generated after a natural-language lesson prompt. */
const NATURAL_VOCABULARY = /^\r?\n本课生字：[^\r\n]*\r?\n本课生词：[^\r\n]*/

const SPECIALIZED_PROMPTS: Readonly<Record<PublicationAuthoringSkill, RegExp>> = {
  'good-friend-story': /^[ \t]+请编写一个主题为“海边露营”的故事(?=\s|$)/,
  'good-friend-happy-kids': /^[ \t]+请以「团结合作」为主题，主角是小熊，写一个关于学校运动会的故事。(?=\s|$)/,
  'knowledge-pictorial-story': /^[ \t]+请编写一篇“(?:哈比系列|动物寓言)”的故事\r?\n故事主题：分享精神(?=\s|$)/,
  'knowledge-news-story': /^[ \t]+请写一篇关于“分享”主题的故事，主角是两个小学生。(?=\s|$)/,
}

/** The authoring selection encoded by a draft's leading invocation. */
export interface AuthoringSelection {
  /** The leading invocation's skill. */
  readonly mode: AuthoringSkill
  /** The bundled content type selected by a specialized invocation or legacy generic metadata. */
  readonly type: string | undefined
  /** Publication generation choice selected by a specialized invocation. */
  readonly content: string | undefined
  /** Story kind selected for a publication option. */
  readonly storyKind: string | undefined
  /** Synchronous-practice type selected for a dedicated practice skill. */
  readonly practiceType: string | undefined
  /** Grade following a generic type, when that type offers it. */
  readonly grade: string | undefined
  /** Lesson following a generic grade, when it names a positive number. */
  readonly lesson: number | undefined
}

const SPECIALIZED_SELECTIONS: Readonly<Record<PublicationAuthoringSkill, {
  readonly type: string
  readonly content: string
}>> = {
  'good-friend-story': { type: '好朋友', content: '欢乐故事' },
  'good-friend-happy-kids': { type: '好朋友', content: '欢乐儿童' },
  'knowledge-pictorial-story': { type: '知识画报', content: '故事园地' },
  'knowledge-news-story': { type: '知识报', content: '故事空间' },
}

/**
 * Read the authoring selection named by the draft's leading tokens.
 * @param draft - Current composer text.
 * @returns The selection, or undefined when no plugin-owned invocation leads the draft.
 */
export function readAuthoringMode(draft: string): AuthoringSelection | undefined {
  const modeMatch = MODE_PREFIX.exec(draft)
  if (modeMatch === null) return undefined
  const mode = modeMatch[1] as AuthoringSkill
  const practice = findPracticeType(mode)
  if (practice !== undefined) {
    const metadata = readPracticeMetadata(draft.slice(modeMatch[0].length), practice)
    const type = findLessonTypeForGrade(metadata.grade)
    return {
      mode,
      type: type?.label,
      content: '同步练习题',
      storyKind: undefined,
      practiceType: practice.label,
      grade: metadata.grade,
      lesson: metadata.lesson,
    }
  }
  if (mode !== 'story' && mode !== 'practice') {
    const publicationMode = mode as PublicationAuthoringSkill
    const specialized = SPECIALIZED_SELECTIONS[publicationMode]
    const storyKind = mode === 'knowledge-pictorial-story'
      ? /^\/knowledge-pictorial-story[ \t]+请编写一篇“(哈比系列|动物寓言)”的故事/.exec(draft)?.[1]
      : undefined
    return {
      mode,
      type: specialized.type,
      content: specialized.content,
      storyKind,
      practiceType: undefined,
      grade: undefined,
      lesson: undefined,
    }
  }

  const typeMatch = TYPE_TOKEN.exec(draft.slice(modeMatch[0].length))
  const type = findAuthoringType(typeMatch?.[1])
  if (type === undefined || type.kind !== 'lesson' || typeMatch === null) {
    return {
      mode,
      type: undefined,
      content: undefined,
      storyKind: undefined,
      practiceType: undefined,
      grade: undefined,
      lesson: undefined,
    }
  }
  const gradeMatch = GRADE_TOKEN.exec(draft.slice(modeMatch[0].length + typeMatch[0].length))
  const gradeToken = gradeMatch?.[1]
  const grade = gradeToken !== undefined && type.grades.some(candidate => candidate.label === gradeToken)
    ? gradeToken
    : undefined
  if (grade === undefined || gradeMatch === null) {
    return {
      mode,
      type: type.label,
      content: undefined,
      storyKind: undefined,
      practiceType: undefined,
      grade,
      lesson: undefined,
    }
  }
  const lessonMatch = LESSON_TOKEN.exec(
    draft.slice(modeMatch[0].length + typeMatch[0].length + gradeMatch[0].length),
  )
  return {
    mode,
    type: type.label,
    content: undefined,
    storyKind: undefined,
    practiceType: undefined,
    grade,
    lesson: lessonMatch === null ? undefined : Number(lessonMatch[1]),
  }
}

/**
 * Replace the leading authoring invocation with a lesson request and its vocabulary.
 * @param draft - Current composer text.
 * @param mode - Generic authoring skill selected by the user.
 * @param grade - Singapore Chinese grade selected by the user.
 * @param lesson - Lesson number selected by the user.
 * @param vocabulary - CSV vocabulary for the selected lesson.
 * @returns Draft beginning with the selected invocation.
 */
export function applyAuthoringMode(
  draft: string,
  mode: 'story' | 'practice',
  grade: string,
  lesson: number,
  vocabulary: LessonVocabulary,
): string {
  return joinInvocation(createLessonPrompt(mode, grade, lesson, vocabulary), stripPreviousInvocation(draft))
}

/**
 * Replace the leading authoring invocation with a LangMind synchronous-practice request.
 *
 * @param draft - Current composer text.
 * @param practice - Selected synchronous-practice type.
 * @param grade - Selected grade and CSV mapping.
 * @param lesson - Selected lesson number.
 * @param vocabulary - CSV vocabulary for the selected lesson.
 * @returns Draft beginning with the dedicated practice skill invocation.
 */
export function applyPracticeAuthoring(
  draft: string,
  practice: PracticeTypeOption,
  grade: AuthoringGrade,
  lesson: number,
  vocabulary: LessonVocabulary,
): string {
  const invocation = createPracticePrompt(practice, grade.label, lesson, vocabulary)
  return joinInvocation(invocation, stripPreviousInvocation(draft))
}

/**
 * Replace the leading authoring invocation with a publication-specific story request.
 * @param draft - Current composer text.
 * @param type - Publication containing the selected generation choice.
 * @param content - Selected publication generation choice.
 * @param storyKind - Required story kind for choices that offer one.
 * @returns Draft beginning with the selected dedicated skill invocation.
 */
export function applyPublicationAuthoring(
  draft: string,
  type: PublicationAuthoringType,
  content: string,
  storyKind?: string,
): string {
  const option = type.contents.find(candidate => candidate.label === content)
  if (option === undefined) throw new Error(`authoring: ${type.label} does not offer ${content}`)
  if (option.storyKinds !== undefined && (storyKind === undefined || !option.storyKinds.includes(storyKind))) {
    throw new Error(`authoring: ${content} requires a valid story kind`)
  }
  return joinInvocation(createPublicationPrompt(option.skill, storyKind), stripPreviousInvocation(draft))
}

function stripPreviousInvocation(draft: string): string {
  const modeMatch = MODE_PREFIX.exec(draft)
  if (modeMatch === null) return draft.trim()
  const mode = modeMatch[1] as AuthoringSkill
  let rest = draft.slice(modeMatch[0].length)
  const practice = findPracticeType(mode)
  if (practice !== undefined) {
    const promptMatch = practicePromptPattern(practice).exec(rest)
    if (promptMatch !== null) rest = rest.slice(promptMatch[0].length)
    return rest.trim()
  }
  if (mode !== 'story' && mode !== 'practice') {
    const promptMatch = SPECIALIZED_PROMPTS[mode as PublicationAuthoringSkill].exec(rest)
    if (promptMatch !== null) rest = rest.slice(promptMatch[0].length)
    return rest.trim()
  }

  const naturalPromptMatch = NATURAL_PROMPT.exec(rest)
  if (naturalPromptMatch !== null) {
    rest = rest.slice(naturalPromptMatch[0].length)
    const vocabularyMatch = NATURAL_VOCABULARY.exec(rest)
    if (vocabularyMatch !== null) rest = rest.slice(vocabularyMatch[0].length)
    return rest.trim()
  }

  const typeMatch = TYPE_TOKEN.exec(rest)
  const previousType = findAuthoringType(typeMatch?.[1])
  if (typeMatch === null || previousType === undefined || previousType.kind !== 'lesson') return rest.trim()
  rest = rest.slice(typeMatch[0].length)
  const gradeMatch = GRADE_TOKEN.exec(rest)
  const gradeToken = gradeMatch?.[1]
  if (gradeMatch === null || gradeToken === undefined
    || !previousType.grades.some(candidate => candidate.label === gradeToken)) return rest.trim()
  rest = rest.slice(gradeMatch[0].length)
  const lessonMatch = LESSON_TOKEN.exec(rest)
  if (lessonMatch === null) return rest.trim()
  rest = rest.slice(lessonMatch[0].length)
  const previousGrade = previousType.grades.find(candidate => candidate.label === gradeToken)
  const previousVocabulary = previousGrade === undefined
    ? undefined
    : vocabularyForLesson(previousGrade, Number(lessonMatch[1]))
  const previousPrompt = previousVocabulary === undefined
    ? undefined
    : formatLessonVocabulary(Number(lessonMatch[1]), previousVocabulary)
  const vocabularyLines = previousPrompt?.slice(previousPrompt.indexOf('\n'))
  if (vocabularyLines !== undefined && rest.startsWith(vocabularyLines)) rest = rest.slice(vocabularyLines.length)
  return rest.trim()
}

function createLessonPrompt(
  mode: 'story' | 'practice',
  grade: string,
  lesson: number,
  vocabulary: LessonVocabulary,
): string {
  const content = mode === 'story' ? '故事' : '练习题'
  const lessonVocabulary = formatLessonVocabulary(lesson, vocabulary)
  const vocabularyLines = lessonVocabulary.slice(lessonVocabulary.indexOf('\n') + 1)
  return `/${mode} 帮我编写 ${grade}年级${formatChineseLesson(lesson)}的${content}\n${vocabularyLines}`
}

function createPracticePrompt(
  practice: PracticeTypeOption,
  grade: string,
  lesson: number,
  vocabulary: LessonVocabulary,
): string {
  const lines = [
    `/${practice.skill} 生成内容：${practice.label}`,
    `年级：${grade}`,
    `课次：${String(lesson)}`,
  ]
  if (practice.vocabulary !== 'words') lines.push(`生字：${formatPracticeTerms(vocabulary.characters)}`)
  if (practice.vocabulary !== 'characters') lines.push(`词语：${formatPracticeTerms(vocabulary.words)}`)
  return lines.join('\n')
}

function readPracticeMetadata(
  prompt: string,
  practice: PracticeTypeOption,
): { readonly grade: string | undefined; readonly lesson: number | undefined } {
  const match = practicePromptPattern(practice).exec(prompt)
  if (match === null) return { grade: undefined, lesson: undefined }
  return { grade: match[1], lesson: Number(match[2]) }
}

function practicePromptPattern(practice: PracticeTypeOption): RegExp {
  const vocabularyLines = practice.vocabulary === 'both'
    ? '\\r?\\n生字：[^\\r\\n]*\\r?\\n词语：[^\\r\\n]*'
    : practice.vocabulary === 'characters'
      ? '\\r?\\n生字：[^\\r\\n]*'
      : '\\r?\\n词语：[^\\r\\n]*'
  return new RegExp(
    `^[ \\t]+生成内容：${practice.label}\\r?\\n年级：([^\\r\\n]+)\\r?\\n课次：([1-9]\\d*)${vocabularyLines}(?=\\s|$)`,
  )
}

function findLessonTypeForGrade(grade: string | undefined): LessonAuthoringType | undefined {
  if (grade === undefined) return undefined
  return AUTHORING_TYPES.find((type): type is LessonAuthoringType =>
    type.kind === 'lesson' && type.grades.some(candidate => candidate.label === grade))
}

function formatPracticeTerms(terms: readonly string[]): string {
  return terms.length === 0 ? '（未读取到）' : terms.join('、')
}

function createPublicationPrompt(skill: PublicationAuthoringSkill, storyKind?: string): string {
  switch (skill) {
    case 'good-friend-story': return '/good-friend-story 请编写一个主题为“海边露营”的故事'
    case 'good-friend-happy-kids': return '/good-friend-happy-kids 请以「团结合作」为主题，主角是小熊，写一个关于学校运动会的故事。'
    case 'knowledge-pictorial-story': return `/knowledge-pictorial-story 请编写一篇“${storyKind ?? ''}”的故事\n故事主题：分享精神`
    case 'knowledge-news-story': return '/knowledge-news-story 请写一篇关于“分享”主题的故事，主角是两个小学生。'
  }
}

function joinInvocation(invocation: string, tail: string): string {
  return tail === '' ? invocation : `${invocation}\n${tail}`
}

function formatChineseLesson(lesson: number): string {
  const digits = '零一二三四五六七八九'
  if (lesson < 10) return `第${digits[lesson]}课`
  if (lesson < 20) return `第十${lesson === 10 ? '' : digits[lesson - 10]}课`
  if (lesson < 100) {
    const tens = Math.floor(lesson / 10)
    const ones = lesson % 10
    return `第${digits[tens]}十${ones === 0 ? '' : digits[ones]}课`
  }
  return `第${String(lesson)}课`
}
