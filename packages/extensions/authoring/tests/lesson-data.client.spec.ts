import { describe, expect, it } from 'vitest'
import { AUTHORING_TYPES } from '../src/client/content.ts'
import { lessonsForGrade, vocabularyForLesson } from '../src/client/lesson-data.ts'

function grade(type: string, label: string) {
  const typeEntry = AUTHORING_TYPES.find(candidate => candidate.label === type)
  const entry = typeEntry?.kind === 'lesson'
    ? typeEntry.grades.find(candidate => candidate.label === label)
    : undefined
  if (entry === undefined) throw new Error(`missing test grade ${type} ${label}`)
  return entry
}

describe('authoring lesson vocabulary', () => {
  it('derives the available lessons from each CSV grade', () => {
    expect(lessonsForGrade(grade('新朋友', 'P1'))).toEqual(Array.from({ length: 19 }, (_, index) => index + 1))
    expect(lessonsForGrade(grade('新列车', 'P6'))).toEqual(Array.from({ length: 10 }, (_, index) => index + 1))
    expect(lessonsForGrade(grade('新列车', 'P6高'))).toEqual(Array.from({ length: 12 }, (_, index) => index + 1))
  })

  it('returns separate deduplicated character and word lists for a lesson', () => {
    const vocabulary = vocabularyForLesson(grade('新朋友', 'P1'), 1)
    expect(vocabulary).toBeDefined()
    expect(vocabulary?.characters.length).toBeGreaterThan(0)
    expect(vocabulary?.words.length).toBeGreaterThan(0)
    expect(new Set(vocabulary?.characters).size).toBe(vocabulary?.characters.length)
    expect(new Set(vocabulary?.words).size).toBe(vocabulary?.words.length)
  })
})
