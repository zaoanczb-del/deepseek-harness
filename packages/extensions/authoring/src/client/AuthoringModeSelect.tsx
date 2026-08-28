import { useEffect, useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { Button, IconChevronDownOutline14, IconSkillOutline16, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { AuthoringModeInjected } from './index.ts'
import {
  AUTHORING_TYPES,
  findPracticeType,
  findAuthoringType,
  practicesForType,
  supportsPracticeGrade,
  type AuthoringSkill,
  type AuthoringType,
  type LessonAuthoringType,
  type PublicationContentOption,
} from './content.ts'
import { lessonsForGrade, vocabularyForLesson } from './lesson-data.ts'
import {
  applyAuthoringMode,
  applyPracticeAuthoring,
  applyPublicationAuthoring,
  readAuthoringMode,
} from './draft.ts'
import css from './AuthoringModeSelect.module.css'

/** Complete props supplied by the session slot, plugin injection, and locale seat. */
export type AuthoringModeSelectProps =
  PropsRuntime<'conversation.input.left'> & InjectFace<AuthoringModeInjected> & PropsLocale<'authoring'>

const DEFAULT_TYPE = '新朋友'
const DEFAULT_SKILL: AuthoringSkill = 'story'

/** Pick a bundled catalog choice, then write its dedicated invocation into the draft. */
export function AuthoringModeSelect({ sessionId, input, inputActions, listModes, t }: AuthoringModeSelectProps) {
  const [open, setOpen] = useState(false)
  const [availableSkills, setAvailableSkills] = useState<readonly AuthoringSkill[] | undefined>(undefined)
  const [type, setType] = useState<string | undefined>(undefined)
  const [skill, setSkill] = useState<AuthoringSkill | undefined>(undefined)
  const [content, setContent] = useState<string | undefined>(undefined)
  const [storyKind, setStoryKind] = useState<string | undefined>(undefined)
  const [grade, setGrade] = useState<string | undefined>(undefined)
  const [lesson, setLesson] = useState<number | undefined>(undefined)

  useEffect(() => {
    const abort = new AbortController()
    setAvailableSkills(undefined)
    void listModes(sessionId, abort.signal).then(setAvailableSkills, () => { setAvailableSkills([]) })
    return () => { abort.abort() }
  }, [listModes, sessionId])

  useEffect(() => {
    if (input.phase !== 'plain') setOpen(false)
  }, [input.phase])

  if (availableSkills === undefined || availableSkills.length === 0) return null

  const selected = readAuthoringMode(input.draft)
  const selectedType = findAuthoringType(type)
  const selectedContent = selectedType?.kind === 'publication'
    ? selectedType.contents.find(candidate => candidate.label === content)
    : undefined
  const selectedGrade = selectedType?.kind === 'lesson'
    ? selectedType.grades.find(entry => entry.label === grade)
    : undefined
  const practiceOptions = selectedType?.kind === 'lesson' ? practicesForType(selectedType) : undefined
  const selectedPractice = findPracticeType(skill)
  const grades = selectedType?.kind === 'lesson' && skill !== undefined
    ? selectedPractice === undefined
      ? selectedType.grades
      : selectedType.grades.filter(candidate => supportsPracticeGrade(selectedPractice, candidate))
    : undefined
  const lessons = selectedGrade === undefined ? undefined : lessonsForGrade(selectedGrade)
  const selectedVocabulary = selectedGrade === undefined || lesson === undefined
    ? undefined
    : vocabularyForLesson(selectedGrade, lesson)
  const lessonConfirmable = selectedType?.kind === 'lesson'
    && skill !== undefined
    && (skill === 'story' || selectedPractice !== undefined)
    && availableSkills.includes(skill)
    && selectedGrade !== undefined
    && lesson !== undefined
    && selectedVocabulary !== undefined
  const publicationConfirmable = selectedType?.kind === 'publication'
    && selectedContent !== undefined
    && availableSkills.includes(selectedContent.skill)
    && (selectedContent.storyKinds === undefined
      || (storyKind !== undefined && selectedContent.storyKinds.includes(storyKind)))
  const confirmable = lessonConfirmable || publicationConfirmable

  const applyLessonDefaults = (
    candidate: LessonAuthoringType,
    nextSkill: AuthoringSkill | undefined,
    restored: ReturnType<typeof readAuthoringMode>,
  ): void => {
    const practice = findPracticeType(nextSkill)
    const grades = practice === undefined
      ? candidate.grades
      : candidate.grades.filter(entry => supportsPracticeGrade(practice, entry))
    const restoredGrade = restored?.type === candidate.label
      ? grades.find(entry => entry.label === restored.grade)
      : undefined
    const grade = restoredGrade ?? grades[0]
    const lessons = grade === undefined ? undefined : lessonsForGrade(grade)
    const restoredLesson = restored?.type === candidate.label
      && restored.lesson !== undefined
      && lessons?.includes(restored.lesson) === true
      ? restored.lesson
      : undefined
    setGrade(grade?.label)
    setLesson(restoredLesson ?? lessons?.[0])
  }

  const setTypeDefaults = (
    candidate: AuthoringType,
    restored: ReturnType<typeof readAuthoringMode>,
  ): AuthoringSkill | undefined => {
    setType(candidate.label)
    setGrade(undefined)
    setLesson(undefined)
    if (candidate.kind === 'lesson') {
      const restoredPractice = restored?.type === candidate.label
        ? practicesForType(candidate).find(option => option.label === restored.practiceType)
        : undefined
      const nextSkill = restored?.type === candidate.label
        && restored.mode === 'story'
        && availableSkills.includes('story')
        ? 'story'
        : restoredPractice !== undefined && availableSkills.includes(restoredPractice.skill)
          ? restoredPractice.skill
          : restored?.type === candidate.label && restored.mode === 'practice'
            ? practicesForType(candidate).find(option => availableSkills.includes(option.skill))?.skill
            : availableSkills.includes(DEFAULT_SKILL)
              ? DEFAULT_SKILL
              : practicesForType(candidate).find(option => availableSkills.includes(option.skill))?.skill
      setSkill(nextSkill)
      setContent(undefined)
      setStoryKind(undefined)
      applyLessonDefaults(candidate, nextSkill, restored)
      return nextSkill
    }
    const restoredContent = restored?.type === candidate.label
      ? candidate.contents.find(option => option.label === restored.content && availableSkills.includes(option.skill))
      : undefined
    const nextContent = restoredContent ?? candidate.contents.find(option => availableSkills.includes(option.skill))
    setSkill(nextContent?.skill)
    setContent(nextContent?.label)
    setStoryKind(nextContent?.storyKinds?.includes(restored?.storyKind ?? '') === true
      ? restored?.storyKind
      : nextContent?.storyKinds?.[0])
    return nextContent?.skill
  }

  const openDialog = (): void => {
    const initialType = findAuthoringType(selected?.type) ?? findAuthoringType(DEFAULT_TYPE)
    /* v8 ignore next -- the bundled roster always contains the default type */
    if (initialType === undefined) return
    setTypeDefaults(initialType, selected)
    setOpen(true)
  }
  const close = (): void => { setOpen(false) }
  const confirm = (): void => {
    if (selectedType?.kind === 'lesson') {
      /* v8 ignore next -- the confirm button is disabled until the lesson selection is complete */
      if (selectedGrade === undefined || lesson === undefined || selectedVocabulary === undefined) return
      if (skill === 'story') {
        inputActions.setDraft(applyAuthoringMode(input.draft, skill, selectedGrade.label, lesson, selectedVocabulary))
      } else if (selectedPractice !== undefined) {
        inputActions.setDraft(
          applyPracticeAuthoring(input.draft, selectedPractice, selectedGrade, lesson, selectedVocabulary),
        )
      } else {
        /* v8 ignore next -- the confirm button requires a story or dedicated practice skill */
        return
      }
    } else if (selectedType?.kind === 'publication') {
      /* v8 ignore next -- the confirm button is disabled until the publication selection is complete */
      if (selectedContent === undefined) return
      inputActions.setDraft(applyPublicationAuthoring(input.draft, selectedType, selectedContent.label, storyKind))
    } else {
      /* v8 ignore next -- every rendered type card comes from the bundled roster */
      return
    }
    setOpen(false)
  }

  const selectLessonMode = (candidate: 'story' | 'practice'): void => {
    if (selectedType?.kind !== 'lesson') return
    const nextSkill = candidate === 'story' && availableSkills.includes('story')
      ? 'story'
      : practiceOptions?.find(option => availableSkills.includes(option.skill))?.skill
    setSkill(nextSkill)
    applyLessonDefaults(selectedType, nextSkill, undefined)
  }

  const selectPublicationContent = (option: PublicationContentOption): void => {
    setContent(option.label)
    setSkill(option.skill)
    setStoryKind(option.storyKinds?.[0])
  }

  return (
    <>
      <button
        type="button"
        className={css.trigger}
        aria-label={t('selector.aria')}
        disabled={input.phase !== 'plain'}
        onClick={openDialog}
      >
        <span className={css.triggerIcon} aria-hidden>
          <IconSkillOutline16 />
        </span>
        <span className={css.triggerLabel}>{t('selector.placeholder')}</span>
        <span className={open ? `${css.chevron} ${css.chevronOpen}` : css.chevron} aria-hidden>
          <IconChevronDownOutline14 />
        </span>
      </button>
      <Modal
        open={open}
        onClose={close}
        title={t('dialog.title')}
        closeLabel={t('dialog.close')}
        className={css.dialog ?? ''}
        footer={(
          <>
            <Button onClick={close}>{t('dialog.cancel')}</Button>
            <Button variant="primary" className={css.confirmButton} disabled={!confirmable} onClick={confirm}>{t('dialog.confirm')}</Button>
          </>
        )}
      >
        <div className={css.typeGrid} role="radiogroup" aria-label={t('dialog.title')}>
          {AUTHORING_TYPES.map(entry => (
            <button
              key={entry.label}
              type="button"
              role="radio"
              aria-checked={type === entry.label}
              className={type === entry.label ? `${css.typeCard} ${css.typeCardSelected}` : css.typeCard}
              onClick={() => { setTypeDefaults(entry, undefined) }}
            >
              <span className={css.typeName}>{entry.label}</span>
              <span className={css.typeSubtitle}>{entry.subtitle}</span>
            </button>
          ))}
        </div>
        <h3 className={css.sectionTitle}>{t('section.content')}</h3>
        <div className={css.modeGroup} role="radiogroup" aria-label={t('section.content')}>
          {selectedType?.kind === 'publication'
            ? selectedType.contents.map(option => (
              <button
                key={option.label}
                type="button"
                role="radio"
                aria-checked={content === option.label}
                disabled={!availableSkills.includes(option.skill)}
                className={content === option.label ? `${css.modeOption} ${css.modeOptionSelected}` : css.modeOption}
                onClick={() => { selectPublicationContent(option) }}
              >
                {option.label}
              </button>
            ))
            : (['story', 'practice'] as const).map((candidate) => {
              const candidateSelected = candidate === 'story' ? skill === 'story' : selectedPractice !== undefined
              const candidateAvailable = candidate === 'story'
                ? availableSkills.includes('story')
                : practiceOptions?.some(option => availableSkills.includes(option.skill)) === true
              return (
                <button
                  key={candidate}
                  type="button"
                  role="radio"
                  aria-checked={candidateSelected}
                  disabled={!candidateAvailable}
                  className={candidateSelected ? `${css.modeOption} ${css.modeOptionSelected}` : css.modeOption}
                  onClick={() => { selectLessonMode(candidate) }}
                >
                  {t(`mode.${candidate}`)}
                </button>
              )
            })}
        </div>
        {selectedType?.kind === 'lesson' && selectedPractice !== undefined && practiceOptions !== undefined && (
          <>
            <h3 className={css.sectionTitle}>{t('section.practiceType')}</h3>
            <div className={css.practiceGroup} role="radiogroup" aria-label={t('section.practiceType')}>
              {practiceOptions.map(option => (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={skill === option.skill}
                  disabled={!availableSkills.includes(option.skill)}
                  className={skill === option.skill ? `${css.modeOption} ${css.modeOptionSelected}` : css.modeOption}
                  onClick={() => {
                    setSkill(option.skill)
                    if (selectedGrade !== undefined && !supportsPracticeGrade(option, selectedGrade)) {
                      setGrade(undefined)
                      setLesson(undefined)
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
        {selectedContent?.storyKinds !== undefined && (
          <>
            <h3 className={css.sectionTitle}>{t('section.storyKind')}</h3>
            <div className={css.modeGroup} role="radiogroup" aria-label={t('section.storyKind')}>
              {selectedContent.storyKinds.map(candidate => (
                <button
                  key={candidate}
                  type="button"
                  role="radio"
                  aria-checked={storyKind === candidate}
                  className={storyKind === candidate ? `${css.modeOption} ${css.modeOptionSelected}` : css.modeOption}
                  onClick={() => { setStoryKind(candidate) }}
                >
                  {candidate}
                </button>
              ))}
            </div>
          </>
        )}
        {grades !== undefined && (
          <>
            <h3 className={css.sectionTitle}>{t('section.grade')}</h3>
            <div className={css.gradeGroup} role="radiogroup" aria-label={t('section.grade')}>
              {grades.map(candidate => (
                <button
                  key={candidate.label}
                  type="button"
                  role="radio"
                  aria-checked={grade === candidate.label}
                  className={grade === candidate.label
                    ? `${css.gradeOption} ${css.gradeOptionSelected}`
                    : css.gradeOption}
                  onClick={() => {
                    setGrade(candidate.label)
                    setLesson(undefined)
                  }}
                >
                  {candidate.label}
                </button>
              ))}
            </div>
          </>
        )}
        {lessons !== undefined && (
          <>
            <h3 className={css.sectionTitle}>{t('section.lesson')}</h3>
            <div className={css.lessonGroup} role="radiogroup" aria-label={t('section.lesson')}>
              {lessons.map(candidate => (
                <button
                  key={candidate}
                  type="button"
                  role="radio"
                  aria-checked={lesson === candidate}
                  className={lesson === candidate
                    ? `${css.lessonOption} ${css.lessonOptionSelected}`
                    : css.lessonOption}
                  onClick={() => { setLesson(candidate) }}
                >
                  {candidate}
                </button>
              ))}
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
