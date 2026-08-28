/** Bundled authoring catalogs offered by the selection dialog. */

/** Skill names the authoring selector can invoke. */
export type AuthoringSkill =
  | 'story'
  | 'practice'
  | PracticeAuthoringSkill
  | PublicationAuthoringSkill

/** Dedicated publication story skills. */
export type PublicationAuthoringSkill =
  | 'good-friend-story'
  | 'good-friend-happy-kids'
  | 'knowledge-pictorial-story'
  | 'knowledge-news-story'

/** Dedicated textbook practice skills migrated from LangMind. */
export type PracticeAuthoringSkill =
  | 'practice-xuan-pin-ying'
  | 'practice-pei-ci'
  | 'practice-shu-bi-hua'
  | 'practice-tian-xie-han-zi'
  | 'practice-tian-xie-pin-yin'
  | 'practice-zu-ci-cheng-ju'
  | 'practice-wan-cheng-ju-zi'
  | 'practice-xuan-ze-yin-jie'
  | 'practice-bian-zi-ce-yan'
  | 'practice-ci-yi-xuan-ze'
  | 'practice-ci-yu-da-pei'
  | 'practice-ci-yu-xuan-ze'
  | 'practice-ju-zi-xuan-ze'
  | 'practice-pin-ying-xuan-ze'

/** Every skill name owned by the authoring plugin. */
export const AUTHORING_SKILLS: readonly AuthoringSkill[] = [
  'story',
  'practice',
  'practice-xuan-pin-ying',
  'practice-pei-ci',
  'practice-shu-bi-hua',
  'practice-tian-xie-han-zi',
  'practice-tian-xie-pin-yin',
  'practice-zu-ci-cheng-ju',
  'practice-wan-cheng-ju-zi',
  'practice-xuan-ze-yin-jie',
  'practice-bian-zi-ce-yan',
  'practice-ci-yi-xuan-ze',
  'practice-ci-yu-da-pei',
  'practice-ci-yu-xuan-ze',
  'practice-ju-zi-xuan-ze',
  'practice-pin-ying-xuan-ze',
  'good-friend-story',
  'good-friend-happy-kids',
  'knowledge-pictorial-story',
  'knowledge-news-story',
]

/** One Singapore Chinese grade and its CSV grade code. */
export interface AuthoringGrade {
  /** Grade label shown in the selector and included in the generated prompt. */
  readonly label: string
  /** Numeric grade code used by `ezhishi_words.csv`. */
  readonly csvCode: number
  /** Primary grade number used to enforce a practice type's LangMind range. */
  readonly gradeNumber: number
}

/** Lesson vocabulary fields supplied to one practice skill. */
export type PracticeVocabularySource = 'characters' | 'words' | 'both'

/** One LangMind synchronous-practice type. */
export interface PracticeTypeOption {
  /** Exercise name shown in the selector and generated draft. */
  readonly label: string
  /** Dedicated skill that owns the exercise rules. */
  readonly skill: PracticeAuthoringSkill
  /** Inclusive primary-grade range supported by LangMind. */
  readonly grades: readonly [min: number, max: number]
  /** Lesson vocabulary fields supplied to the exercise. */
  readonly vocabulary: PracticeVocabularySource
}

/** A textbook catalog whose requests use a grade, lesson, and lesson vocabulary. */
export interface LessonAuthoringType {
  /** Discriminant for the grade-and-lesson workflow. */
  readonly kind: 'lesson'
  /** Type name shown in the selector. */
  readonly label: string
  /** Grade-range subtitle rendered under the name. */
  readonly subtitle: string
  /** Singapore Chinese grades offered for this content type. */
  readonly grades: readonly AuthoringGrade[]
}

/** One publication-specific generation option. */
export interface PublicationContentOption {
  /** Label shown under Generate content. */
  readonly label: string
  /** Skill invoked when this option is confirmed. */
  readonly skill: PublicationAuthoringSkill
  /** Optional story kinds shown after this option is selected. */
  readonly storyKinds?: readonly string[]
}

/** A publication catalog whose content option selects a dedicated skill. */
export interface PublicationAuthoringType {
  /** Discriminant for the publication-option workflow. */
  readonly kind: 'publication'
  /** Type name shown in the selector. */
  readonly label: string
  /** Grade-range subtitle rendered under the name. */
  readonly subtitle: string
  /** Publication-specific generation choices. */
  readonly contents: readonly PublicationContentOption[]
}

/** One authoring content type. */
export type AuthoringType = LessonAuthoringType | PublicationAuthoringType

const LOWER_PRIMARY_GRADES = [
  { label: 'P1', csvCode: 1, gradeNumber: 1 },
  { label: 'P1高', csvCode: 7, gradeNumber: 1 },
  { label: 'P2', csvCode: 2, gradeNumber: 2 },
  { label: 'P2高', csvCode: 8, gradeNumber: 2 },
] as const
const MIDDLE_PRIMARY_GRADES = [
  { label: 'P3', csvCode: 3, gradeNumber: 3 },
  { label: 'P3高', csvCode: 9, gradeNumber: 3 },
  { label: 'P4', csvCode: 4, gradeNumber: 4 },
  { label: 'P4高', csvCode: 10, gradeNumber: 4 },
] as const
const UPPER_PRIMARY_GRADES = [
  { label: 'P5', csvCode: 5, gradeNumber: 5 },
  { label: 'P5高', csvCode: 11, gradeNumber: 5 },
  { label: 'P6', csvCode: 6, gradeNumber: 6 },
  { label: 'P6高', csvCode: 12, gradeNumber: 6 },
] as const

/** LangMind practice types, in display order. */
export const PRACTICE_TYPES: readonly PracticeTypeOption[] = [
  { label: '选拼音', skill: 'practice-xuan-pin-ying', grades: [1, 1], vocabulary: 'characters' },
  { label: '配词', skill: 'practice-pei-ci', grades: [1, 1], vocabulary: 'both' },
  { label: '数笔画', skill: 'practice-shu-bi-hua', grades: [1, 1], vocabulary: 'characters' },
  { label: '填写汉字', skill: 'practice-tian-xie-han-zi', grades: [1, 6], vocabulary: 'both' },
  { label: '填写拼音', skill: 'practice-tian-xie-pin-yin', grades: [2, 2], vocabulary: 'both' },
  { label: '组词成句', skill: 'practice-zu-ci-cheng-ju', grades: [1, 6], vocabulary: 'both' },
  { label: '完成句子', skill: 'practice-wan-cheng-ju-zi', grades: [1, 6], vocabulary: 'both' },
  { label: '选择音节', skill: 'practice-xuan-ze-yin-jie', grades: [2, 2], vocabulary: 'both' },
  { label: '辨字测验', skill: 'practice-bian-zi-ce-yan', grades: [2, 2], vocabulary: 'characters' },
  { label: '词义选择', skill: 'practice-ci-yi-xuan-ze', grades: [3, 6], vocabulary: 'words' },
  { label: '词语搭配', skill: 'practice-ci-yu-da-pei', grades: [3, 4], vocabulary: 'words' },
  { label: '词语选择', skill: 'practice-ci-yu-xuan-ze', grades: [1, 6], vocabulary: 'words' },
  { label: '句子选择', skill: 'practice-ju-zi-xuan-ze', grades: [2, 6], vocabulary: 'words' },
  { label: '拼音选择', skill: 'practice-pin-ying-xuan-ze', grades: [2, 6], vocabulary: 'words' },
]

/** The content types the dialog offers, in display order. */
export const AUTHORING_TYPES: readonly AuthoringType[] = [
  { kind: 'lesson', label: '新朋友', subtitle: 'P1-P2', grades: LOWER_PRIMARY_GRADES },
  { kind: 'lesson', label: '新天地', subtitle: 'P3-P4', grades: MIDDLE_PRIMARY_GRADES },
  { kind: 'lesson', label: '新列车', subtitle: 'P5-P6', grades: UPPER_PRIMARY_GRADES },
  {
    kind: 'publication',
    label: '好朋友',
    subtitle: 'P1-P2',
    contents: [
      { label: '欢乐故事', skill: 'good-friend-story' },
      { label: '欢乐儿童', skill: 'good-friend-happy-kids' },
    ],
  },
  {
    kind: 'publication',
    label: '知识画报',
    subtitle: 'P3-P4',
    contents: [
      {
        label: '故事园地',
        skill: 'knowledge-pictorial-story',
        storyKinds: ['哈比系列', '动物寓言'],
      },
    ],
  },
  {
    kind: 'publication',
    label: '知识报',
    subtitle: 'P5-P6',
    contents: [{ label: '故事空间', skill: 'knowledge-news-story' }],
  },
]

/**
 * Find a bundled content type by its display label.
 * @param label - Product label to resolve.
 * @returns The matching bundled type, or undefined for an unknown label.
 */
export function findAuthoringType(label: string | undefined): AuthoringType | undefined {
  return label === undefined ? undefined : AUTHORING_TYPES.find(candidate => candidate.label === label)
}

/**
 * List practice types whose grade range intersects one textbook catalog.
 *
 * @param type - Textbook catalog selected in the dialog.
 * @returns LangMind practice options offered for the catalog.
 */
export function practicesForType(type: LessonAuthoringType): readonly PracticeTypeOption[] {
  return PRACTICE_TYPES.filter(practice => type.grades.some(grade => supportsPracticeGrade(practice, grade)))
}

/**
 * Test whether a practice type supports one displayed grade.
 *
 * @param practice - Practice type whose range should be checked.
 * @param grade - Displayed ordinary or Higher Chinese grade.
 * @returns Whether LangMind offers the practice at that grade.
 */
export function supportsPracticeGrade(practice: PracticeTypeOption, grade: AuthoringGrade): boolean {
  return grade.gradeNumber >= practice.grades[0] && grade.gradeNumber <= practice.grades[1]
}

/**
 * Find a practice type by its dedicated skill.
 *
 * @param skill - Available authoring skill.
 * @returns Matching practice type, or `undefined` for another skill.
 */
export function findPracticeType(skill: AuthoringSkill | undefined): PracticeTypeOption | undefined {
  return PRACTICE_TYPES.find(practice => practice.skill === skill)
}
