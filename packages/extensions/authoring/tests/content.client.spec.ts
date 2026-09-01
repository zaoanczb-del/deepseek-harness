import { describe, expect, it } from 'vitest'
import { AUTHORING_TYPES, NEW_WORLD_MORAL_UNITS, PRACTICE_TYPES, practicesForType } from '../src/client/content.ts'

function lessonType(label: string) {
  const type = AUTHORING_TYPES.find(candidate => candidate.label === label)
  if (type?.kind !== 'lesson') throw new Error(`missing lesson type ${label}`)
  return type
}

describe('authoring practice catalog', () => {
  it('preserves every New World moral unit in display order', () => {
    expect(NEW_WORLD_MORAL_UNITS.map(unit => [unit.unitNumber, unit.lessonTitle, unit.theme])).toEqual([
      [1, '我的第一份礼物', '我的名字'],
      [2, '我的家人', '关爱和尊重家人'],
      [3, '说声谢谢你', '学会感恩'],
      [4, '我有勇气', '勇敢面对困难'],
      [5, '宝贵的食物', '珍惜食物'],
      [6, '我会用心听', '用心听'],
      [7, '怎样说？怎样做？', '尊重他人'],
      [8, '关心每一个人', '关心和尊重别人'],
      [9, '不同想法，一个目标', '为实现共同目标而努力'],
    ])
  })

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
