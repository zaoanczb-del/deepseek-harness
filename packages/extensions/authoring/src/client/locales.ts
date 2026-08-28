/** Locale namespace owned by the authoring selector. */
export const NS = 'authoring'

/** English authoring selector copy. */
export const en = {
  'selector.placeholder': 'Select content',
  'selector.aria': 'Select content',
  'mode.story': 'Story',
  'mode.practice': 'Practice',
  'dialog.title': 'Type',
  'section.content': 'Generate content',
  'section.storyKind': 'Story type',
  'section.practiceType': 'Practice type',
  'section.grade': 'Grade',
  'section.lesson': 'Lesson',
  'dialog.close': 'Close',
  'dialog.confirm': 'Confirm',
  'dialog.cancel': 'Cancel',
} as const

/** Simplified-Chinese authoring selector copy. */
export const zh: Record<keyof typeof en, string> = {
  'selector.placeholder': '选择内容',
  'selector.aria': '选择内容',
  'mode.story': '编写故事',
  'mode.practice': '练习题',
  'dialog.title': '类型',
  'section.content': '生成内容',
  'section.storyKind': '故事类型',
  'section.practiceType': '练习类型',
  'section.grade': '年级',
  'section.lesson': '课次',
  'dialog.close': '关闭',
  'dialog.confirm': '确定',
  'dialog.cancel': '取消',
}

/** Valid authoring locale keys. */
export type AuthoringKey = keyof typeof en
