/** Bundled authoring catalogs offered by the selection dialog. */

/** Skill names the authoring selector can invoke. */
export type AuthoringSkill =
  | 'story'
  | 'practice'
  | MoralAuthoringSkill
  | PracticeAuthoringSkill
  | PublicationAuthoringSkill

/** Dedicated New World moral-education skill. */
export type MoralAuthoringSkill = 'new-world-moral-story'

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
  'new-world-moral-story',
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

/** One P3 New World moral-education unit migrated from LangMind. */
export interface MoralUnitOption {
  /** Numeric unit identifier used in draft restoration. */
  readonly unitNumber: number
  /** Chinese unit numeral shown in the selector. */
  readonly unit: string
  /** Textbook lesson title shown in the selector and generated draft. */
  readonly lessonTitle: string
  /** Moral theme passed unchanged to the selected skill. */
  readonly theme: string
  /** Textbook learning goal retained with the unit catalog. */
  readonly learningGoal: string
}

/** The New World moral-education choice attached to its lesson catalog. */
export interface MoralContentOption {
  /** Label shown under Generate content. */
  readonly label: string
  /** Dedicated skill invoked for every unit. */
  readonly skill: MoralAuthoringSkill
  /** P3 units offered after selecting this content. */
  readonly units: readonly MoralUnitOption[]
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
  /** Optional moral-education workflow offered only by New World. */
  readonly moralContent?: MoralContentOption
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

/** P3 New World moral-education units, in LangMind display order. */
export const NEW_WORLD_MORAL_UNITS: readonly MoralUnitOption[] = [
  {
    unitNumber: 1,
    unit: '一',
    lessonTitle: '我的第一份礼物',
    theme: '我的名字',
    learningGoal: '我了解自己名字的意思，知道怎样去实现自己名字的意思，并付出努力去实现。',
  },
  {
    unitNumber: 2,
    unit: '二',
    lessonTitle: '我的家人',
    theme: '关爱和尊重家人',
    learningGoal: '我会尽自己的责任，关爱和尊重家人，努力做好自己要做的事。与兄弟姐妹相亲相爱，互相照顾，互相帮助。',
  },
  {
    unitNumber: 3,
    unit: '三',
    lessonTitle: '说声谢谢你',
    theme: '学会感恩',
    learningGoal: '我懂得感恩，会注意身边值得感恩的人和事物。我会用行动向那些帮助我学习和成长的人、事物以及大自然表示感谢。',
  },
  {
    unitNumber: 4,
    unit: '四',
    lessonTitle: '我有勇气',
    theme: '勇敢面对困难',
    learningGoal: '面对问题或困难时，我会鼓起勇气，鼓励自己积极面对，想办法解决，或勇敢向身边的人求助，努力战胜困难。',
  },
  {
    unitNumber: 5,
    unit: '五',
    lessonTitle: '宝贵的食物',
    theme: '珍惜食物',
    learningGoal: '我知道食物很宝贵。我会珍惜食物，为减少食物浪费付出努力。',
  },
  {
    unitNumber: 6,
    unit: '六',
    lessonTitle: '我会用心听',
    theme: '用心听',
    learningGoal: '我用心听别人的看法和意见，做出更好的决定，让自己不断进步。做决定时考虑别人的意见，让他们感受到关爱和尊重。',
  },
  {
    unitNumber: 7,
    unit: '七',
    lessonTitle: '怎样说？怎样做？',
    theme: '尊重他人',
    learningGoal: '我会尊重他人，有礼貌地和别人说话，用礼貌的行为和尊重的态度跟别人沟通。',
  },
  {
    unitNumber: 8,
    unit: '八',
    lessonTitle: '关心每一个人',
    theme: '关心和尊重别人',
    learningGoal: '我会关心、帮助身边有需要的人，并用礼貌的言行对待别人，与大家互相关爱、互相尊重，友好相处。',
  },
  {
    unitNumber: 9,
    unit: '九',
    lessonTitle: '不同想法，一个目标',
    theme: '为实现共同目标而努力',
    learningGoal: '我会发挥自己的长处，以尊重的态度分享自己的想法，认真听取不同的意见，和大家一起实现共同目标。',
  },
]

/** The content types the dialog offers, in display order. */
export const AUTHORING_TYPES: readonly AuthoringType[] = [
  { kind: 'lesson', label: '新朋友', subtitle: 'P1-P2', grades: LOWER_PRIMARY_GRADES },
  {
    kind: 'lesson',
    label: '新天地',
    subtitle: 'P3-P4',
    grades: MIDDLE_PRIMARY_GRADES,
    moralContent: {
      label: '好品德好公民',
      skill: 'new-world-moral-story',
      units: NEW_WORLD_MORAL_UNITS,
    },
  },
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
