import CSV_TEXT from '../../ezhishi_words.csv?raw'
import type { AuthoringGrade } from './content.ts'

/** Deduplicated vocabulary belonging to one grade lesson. */
export interface LessonVocabulary {
  /** Characters from both the recognition and writing columns. */
  readonly characters: readonly string[]
  /** Words from the CSV's word rows. */
  readonly words: readonly string[]
}

interface LessonAccumulator {
  readonly characters: string[]
  readonly words: string[]
}

const LESSONS = new Map<number, Map<number, LessonAccumulator>>()

function addUnique(values: string[], value: string): void {
  if (!values.includes(value)) values.push(value)
}

function parseCsv(): void {
  for (const [index, line] of CSV_TEXT.split(/\r?\n/).entries()) {
    if (line === '') continue
    const fields = line.split(',')
    if (fields.length !== 5) {
      throw new Error(`authoring: CSV row ${String(index + 1)} must contain five fields`)
    }
    const kind = fields[0]
    const gradeText = fields[2]
    const lessonText = fields[3]
    const term = fields[4]
    const grade = Number(gradeText)
    const lesson = Number(lessonText)
    if (kind === undefined || gradeText === undefined || lessonText === undefined || term === undefined
      || !/^[12]$/.test(kind) || !Number.isInteger(grade) || grade < 1 || grade > 12
      || !Number.isInteger(lesson) || lesson < 1 || term === '') {
      throw new Error(`authoring: CSV row ${String(index + 1)} contains invalid fields`)
    }
    let lessons = LESSONS.get(grade)
    if (lessons === undefined) {
      lessons = new Map()
      LESSONS.set(grade, lessons)
    }
    let vocabulary = lessons.get(lesson)
    if (vocabulary === undefined) {
      vocabulary = { characters: [], words: [] }
      lessons.set(lesson, vocabulary)
    }
    if (kind === '1') addUnique(vocabulary.characters, term)
    else addUnique(vocabulary.words, term)
  }
}

parseCsv()

/**
 * List the lesson numbers present in one CSV grade.
 *
 * @param grade - Grade whose imported lessons should be listed.
 * @returns Sorted lesson numbers available for the grade.
 */
export function lessonsForGrade(grade: AuthoringGrade): readonly number[] {
  return [...(LESSONS.get(grade.csvCode)?.keys() ?? [])].sort((left, right) => left - right)
}

/**
 * Read the vocabulary for one CSV grade and lesson.
 *
 * @param grade - Grade whose vocabulary should be read.
 * @param lesson - Lesson number within the grade.
 * @returns Imported vocabulary, or `undefined` when the lesson is absent.
 */
export function vocabularyForLesson(grade: AuthoringGrade, lesson: number): LessonVocabulary | undefined {
  return LESSONS.get(grade.csvCode)?.get(lesson)
}

/**
 * Format a lesson's vocabulary as model-visible prompt text.
 *
 * @param lesson - Lesson number shown in the prompt.
 * @param vocabulary - Characters and words imported for the lesson.
 * @returns Chinese prompt text containing the lesson vocabulary.
 */
export function formatLessonVocabulary(lesson: number, vocabulary: LessonVocabulary): string {
  return `第${String(lesson)}课\n本课生字：${vocabulary.characters.join('、')}\n本课生词：${vocabulary.words.join('、')}`
}
