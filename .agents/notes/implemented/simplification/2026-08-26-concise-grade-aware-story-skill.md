# Agent Note: Concise grade-aware Story skill

Status: implemented

English | [中文](2026-08-26-concise-grade-aware-story-skill.zh.md)

## Problem

The lesson-based Story flow used six grade-specific prompt files plus a shared legacy rules file. They repeated style guidance, imposed rigid section and count checklists, and retained tool and JSON instructions that are not part of the lesson authoring entry path. The overlap made the model-facing behavior longer and left contradictory requirements such as exact vocabulary coverage versus natural prose.

## Decision

The generic lesson Story flow uses one `skills/story/SKILL.md` as its model-facing source. It keeps the user-selected grade, topic, material, lesson vocabulary, age fit, causal storytelling, and Markdown output as the active requirements. More than 65% of the provided target vocabulary appears naturally in the story, with the first target occurrence marked in Markdown bold for rendering; the model does not list the terms or use them as character names. Grade differences are expressed as three concise complexity bands; only the default total-body ranges remain, with P3 fixed at 350–450 Chinese characters. Tool orchestration, JSON serialization, sentence counts, segment counts, style inventories, title examples, and vocabulary lists are not part of this skill. Publication-specific formats use separate skills under the [authoring catalog decision](../feature/2026-08-24-authoring-mode-plugin.md) because their structures are materially different and mutually exclusive.

## Alternatives considered

**Keep P1–P6 as separate companion prompts.** Rejected because the files duplicated the same behavior and required the loader or caller to choose an additional prompt source that the current skill pipeline does not inject.

**Keep exact paragraph, sentence, dialogue, and style quotas.** Rejected because they constrain composition without expressing a reliable user-facing contract; the story's causal structure and age fit are sufficient guidance for the model.

**Keep the legacy vocabulary tools and JSON response protocol.** Rejected because lesson vocabulary is already model-visible in the user message, the referenced tools have no current implementation in this package, and the generic Story skill returns Markdown.

## Consequences

The generic Story skill is shorter and has one source of truth. The model has discretion over paragraphing, sentence rhythm, dialogue count, and stylistic devices, while target-vocabulary usage, highlighting, total length, and grade complexity remain explicit. Downstream consumers that need structured output must define that protocol separately from the creative guidance.

## Testing

The `story` directory contains one `SKILL.md` and no grade-specific companion prompts. The skill records P3 as 350–450 Chinese characters, requires more than 65% target-vocabulary coverage with first-occurrence Markdown highlighting, and contains no JSON-only output instruction. Draft and component tests cover the separate selection and invocation path; the Web snapshot remains UI-only.
