# Agent Note: Plugin-owned authoring catalogs

Status: implemented

English | [中文](2026-08-24-authoring-mode-plugin.zh.md)

## Problem

Textbook story writing, practice generation, and the Good Friend, Knowledge Pictorial, and Knowledge News publication formats need an explicit choice beside the composer. Adding another fixed InputBar prop would make product-specific content part of the generic conversation shell. Keeping the UI and its model instructions under different presets would also split ownership, while one combined Story prompt would add every publication's unrelated format rules to each request.

## Decision

The tier-spanning `@deepseek-ai/dsh-client-ui-authoring` plugin owns the Web selector and twenty bundled skills. Its host half mounts an isolated packaged Skill provider in the Standard preset scope; its browser half appends one list item to `conversation.input.left` and queries the active session's `skill.list` before exposing available choices.

New Friends, New World, and New Train share the generic `story` skill. Story selection proceeds through ordinary or Higher Chinese grade and a lesson sourced from `ezhishi_words.csv`; confirmation writes the natural-language `/story` request plus the lesson's characters and words. The [concise grade-aware Story decision](../simplification/2026-08-26-concise-grade-aware-story-skill.md) owns those instructions.

Synchronous Practice exposes LangMind's fourteen exercise types. Each type maps to a dedicated skill and retains its original grade range. Selecting a type filters ordinary and Higher Chinese grades to that range, then uses the same CSV lesson catalog. Confirmation writes the type's `/practice-*` token plus `生成内容`, grade, lesson, and the exact input fields its LangMind prompt used: characters, words, or both. Each skill retains the exercise construction and validation rules but replaces LangMind's JSON schema with a readable Markdown exercise section followed by a separate answer section. The generic `practice` skill remains mounted for manual requests but is not the selector's synchronous-practice target.

Good Friend, Knowledge Pictorial, and Knowledge News retain their LangMind publication choices without grade, lesson, or vocabulary fields. Good Friend maps Joyful Story and Happy Kids to separate skills. Knowledge Pictorial maps Story Garden to one skill whose request selects Habi Series or Animal Fable. Knowledge News maps Story Space to one skill. Each dedicated skill carries only that publication's audience, structure, length, exercise, and Markdown-output rules; LangMind's JSON serialization instructions are absent. Confirmation writes the dedicated skill token and an editable default request derived from the corresponding LangMind flow.

The draft remains the model-visible and persisted selection state. Reselection removes a recognized plugin-generated invocation and preserves the remaining user prompt. Submission stays on the existing explicit-skill pipeline: `dsh-tool-skill` recognizes the leading literal and injects only the selected `SKILL.md`; this plugin adds no invocation protocol or session event.

## Alternatives considered

**Put the selector inside the generic InputBar.** Rejected because the existing list slot already supports ordered, plugin-owned controls without giving the conversation shell product catalog knowledge.

**Keep all six types on the grade-and-lesson workflow.** Rejected because the three publications imply their P1–P2, P3–P4, and P5–P6 audiences and LangMind exposes publication-specific sub-options instead of lesson vocabulary.

**Add every publication rule to the generic Story skill.** Rejected because each request would inject mutually exclusive structures and substantial unrelated prompt text. Dedicated skills make the selected format unambiguous and keep the other publication instructions out of the request.

**Add all synchronous-practice rules to the generic Practice skill.** Rejected because the fourteen formats have different grade ranges, vocabulary inputs, option counts, and validation rules. A selected request should not inject the other thirteen formats.

**Preserve LangMind JSON output.** Rejected because this application renders assistant Markdown directly and has no exercise or publication JSON renderer. The migrated skills retain questions, options, and answers as Markdown.

## Testing

Focused draft tests pin practice vocabulary-field mapping, practice and publication prompt replacement, user-text preservation, token boundaries, and selection restoration. Component tests pin the practice rosters and grade filtering for all three textbook ranges, each publication's conditional controls, dedicated invocation, catalog failure behavior, and phase-driven closing. Host lifecycle coverage proves all twenty skills register and dispose. Keyless Web scenarios snapshot the assembled selector and compose real skill requests with CSV vocabulary.

## Consequences

The generic composer remains unchanged, and one plugin owns the authoring catalog from UI choice through model instructions. Practice and publication requests add only one selected format skill and remain transparent because the draft contains the same invocation a user can type. The fixed browser catalog still requires a configuration or skill-metadata channel before deployments can replace practice ranges, publication names, choices, or defaults.
