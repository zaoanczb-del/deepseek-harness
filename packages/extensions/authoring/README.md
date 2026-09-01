---
description: "Authoring selector and bundled LangMind-derived Markdown skills for users and maintainers composing Singapore Chinese textbook and publication requests."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-authoring

English | [中文](README.zh.md)

## Summary

The authoring plugin owns twenty-one bundled skills and the Web selector that invokes them. The generic `story` skill serves the New Friends, New World, and New Train textbook catalogs; New World also contributes a dedicated Good Morals, Good Citizen skill. Fourteen dedicated skills reproduce LangMind's synchronous-practice types, while the generic `practice` skill remains available for manually invoked exercises. Good Friend contributes separate Joyful Story and Happy Kids skills, Knowledge Pictorial contributes a Story Garden skill with Habi Series and Animal Fable choices, and Knowledge News contributes a Story Space skill. The host half mounts these skills into the current agent-preset scope when `registerBundledSkills` is enabled. The shipped Standard preset enables registration; the Web bundle loads the same package with registration disabled so the browser module remains discoverable without adding a global provider.

## Table of Contents

- [Use this package](#use-this-package)
- [Dev Note](#dev-note)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

The browser half appends one entry to `conversation.input.left` and lists the active session's skills before rendering. It stays hidden when none of the plugin-owned skills is available. Activating it opens a modal with six content types.

New Friends, New World, and New Train use the lesson workflow. Selecting a lesson catalog defaults the first grade and lesson; selecting Practice also defaults the first available LangMind type and its first supported grade. Story reveals the selected catalog's ordinary and Higher Chinese grades. Practice first reveals every LangMind type whose supported grades intersect the catalog, with at most five types per row, then limits the grade choices to that type's range. The complete roster is Choose Pinyin, Match Words, Count Strokes, Fill in Characters, Fill in Pinyin, Arrange Words into Sentences, Complete Sentences, Choose Syllables, Character Discrimination Quiz, Word Meaning Choice, Word Collocation, Word Choice, Sentence Choice, and Pinyin Choice. Choosing a grade reveals every lesson present for that grade in `ezhishi_words.csv`.

Story confirmation writes `/story 帮我编写 <grade>年级第N课的故事` followed by the lesson characters and words. Practice confirmation writes a dedicated `/practice-*` invocation followed by LangMind's `生成内容`, `年级`, `课次`, and the exact vocabulary fields required by that type: characters, words, or both. Reselecting restores the practice type, grade, and lesson from this draft metadata.

New World's Good Morals, Good Citizen flow offers the nine LangMind P3 units by lesson title and theme without grade or lesson controls. Confirmation writes `/new-world-moral-story` followed by the selected `单元标题` and `单元主题`. Its dedicated skill produces a four-panel Markdown story with a learning objective, commitments, and an interaction question. It is text-only and provides no image-generation action, prompt, service, or preview.

The three publication catalogs use their LangMind choices without grade, lesson, or lesson vocabulary fields. Good Friend offers Joyful Story and Happy Kids. Knowledge Pictorial selects Story Garden and then Habi Series or Animal Fable. Knowledge News selects Story Space directly. Confirming writes the dedicated skill token plus the publication's editable default request: Seaside Camping for Joyful Story, teamwork at a school sports meet for Happy Kids, sharing for Knowledge Pictorial, and sharing between two pupils for Knowledge News.

The dialog restores recognized textbook-practice, New World moral, and publication tokens, including the selected moral unit and Knowledge Pictorial story kind. Reselecting replaces the plugin-generated invocation while preserving user prompt text. Cancel, the mask, or Escape closes without writing. The existing explicit-skill pipeline interprets the sent token and injects only the selected `SKILL.md`; the plugin introduces no second invocation protocol.

## Configuration

`registerBundledSkills` defaults to `true`. Set it to `false` on host compositions that need only the browser UI. The bundled provider is isolated from project and user skill roots and does not watch packaged files.

-----

<a id="dev-note"></a>
## Dev Note

The [plugin-owned authoring catalogs Agent Note](../../../.agents/notes/implemented/feature/2026-08-24-authoring-mode-plugin.md) records why the selector, fixed catalogs, draft syntax, and dedicated Markdown skills stay under one tier-spanning plugin.

<a id="model-experience"></a>
## Model Experience

### Textbook and publication authoring

#### What the model sees

The model receives the literal invocation and editable request in the user message plus the selected skill's canonical `<skill_content>` injection. Lesson requests include the selected grade, lesson, and the characters or words needed by the selected task. New World moral requests include only the selected unit title and theme. Publication requests include the chosen LangMind content and, for Knowledge Pictorial, its story kind; they do not include lesson metadata. All dedicated moral, publication, and practice skills produce Markdown rather than LangMind's JSON response objects.

#### Token effect

Each request adds one selected skill body. Dedicated moral, practice, and publication skills keep unrelated formats out of that request. The generated request and any lesson vocabulary are part of the user message; opening the dialog and listing skills add no model tokens.

#### KV Cache effect

Append-only: the selected skill content and user message follow the reusable conversation prefix. Earlier request tokens are not rewritten.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Story selections are reconstructed only from legacy metadata syntax; the current natural-language story request does not retain the textbook catalog because the model does not need it. Dedicated practice requests retain enough metadata for full restoration.
- Moral units, publication names, options, default requests, and story kinds are fixed product content in the browser half; deployments needing a different catalog require a config or skill-metadata channel.
- A failed skill catalog request hides the selector for that mount; another session mount or preset switch retries through the normal conversation lifecycle.
