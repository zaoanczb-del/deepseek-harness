import { describe, expect, it } from 'vitest'
import { AUTHORING_TYPES, PRACTICE_TYPES, practicesForType } from '../src/client/content.ts'

function lessonType(label: string) {
  const type = AUTHORING_TYPES.find(candidate => candidate.label === label)
  if (type?.kind !== 'lesson') throw new Error(`missing lesson type ${label}`)
  return type
}

describe('authoring practice catalog', () => {
  it('preserves every LangMind practice type in display order', () => {
    expect(PRACTICE_TYPES.map(candidate => candidate.label)).toEqual([
      '选拼音',
      '配词',
      '数笔画',
      '填写汉字',
      '填写拼音',
      '组词成句',
      '完成句子',
      '选择音节',
      '辨字测验',
      '词义选择',
      '词语搭配',
      '词语选择',
      '句子选择',
      '拼音选择',
    ])
  })

  it('projects the LangMind grade ranges into each textbook catalog', () => {
    expect(practicesForType(lessonType('新朋友')).map(candidate => candidate.label)).toEqual([
      '选拼音', '配词', '数笔画', '填写汉字', '填写拼音', '组词成句', '完成句子',
      '选择音节', '辨字测验', '词语选择', '句子选择', '拼音选择',
    ])
    expect(practicesForType(lessonType('新天地')).map(candidate => candidate.label)).toEqual([
      '填写汉字', '组词成句', '完成句子', '词义选择', '词语搭配', '词语选择', '句子选择', '拼音选择',
    ])
    expect(practicesForType(lessonType('新列车')).map(candidate => candidate.label)).toEqual([
      '填写汉字', '组词成句', '完成句子', '词义选择', '词语选择', '句子选择', '拼音选择',
    ])
  })
})
