# 09 — Documentation Index

`project-brain/` is the permanent, single source of truth for ORNO — for every future developer, designer, and AI agent. It was created 2026-07-05 by auditing the actual codebase, git history (all branches), and pre-existing internal documentation. Read the documents in the order below before implementing any feature.

## Reading order

| # | Document | Answers | Read when |
|---|---|---|---|
| [01](01_CURRENT_STATE.md) | **Current State** | Where is ORNO today? What's actually built, what's stubbed, what's broken? | Always — before touching any code. |
| [02](02_TARGET_ARCHITECTURE.md) | **Target Architecture** | Where is ORNO intentionally going? What's `Planned` vs `In Progress`? | Before proposing or reviewing any structural change. |
| [03](03_PRODUCT.md) | **Product** | What is ORNO, for whom, and why does it exist? | Before making a product/UX judgment call. |
| [04](04_DECISIONS.md) | **Decisions (ADR log)** | Why were past architecture/product calls made, and what's their status? | Before revisiting a past decision. |
| [05](05_ROADMAP.md) | **Roadmap** | What's done, what's next, in what order? | Before scoping new work. |
| [06](06_CLAUDE_RULES.md) | **Claude Rules** | How should an AI agent behave in this repo? | Before writing code. Non-negotiable. |
| [07](07_TECH_DEBT.md) | **Known Issues & Tech Debt** | What's fragile, duplicated, or unresolved? | Before touching auth, roles, demo mode, or theming. |
| [08](08_CHANGELOG.md) | **Changelog** | What actually happened, in what order, with which commits? | Before assuming a "phase" or "migration" name means something specific. |
| 09 | **This index** | How do all these documents relate? | Now. |

## How the documents relate

- **01 and 02 are deliberately separate and must stay that way.** 01 is falsifiable against code today; 02 is a statement of intent. If a future edit blurs that line — describing a `Planned` item as if it exists — that's a defect in the documentation, not a style choice.
- **04 (Decisions) is the hinge between them.** Every ADR states whether it's `Implemented` (belongs to 01's reality) or `Planned` (belongs to 02's intent). When in doubt about an architectural claim, check the matching ADR's status before trusting the claim.
- **05 (Roadmap) and 08 (Changelog) are both chronological, but point in opposite directions** — 08 is the verified past, 05 is the intended future. 05's "Completed" section is just a compressed pointer back into 08.
- **07 (Tech Debt) is the annotation layer on top of 01.** Anything that's "functional" in 01 may still have a caveat in 07 — read both before relying on a module.
- **06 (Claude Rules) operationalizes all of the above** into concrete do/don't rules for agents; it doesn't introduce new facts.

## Relationship to pre-existing documentation

This Project Brain does not replace the following — it supersedes some, defers to others, and cross-references the rest:

| Existing doc | Relationship to `project-brain/` |
|---|---|
| `README.md` | Largely consistent with [01_CURRENT_STATE.md](01_CURRENT_STATE.md); README is the user/contributor-facing quick-start, 01 is the deeper technical audit. Keep both, but treat 01 as authoritative on any discrepancy. |
| `docs/manuales/manual-sistema.md` | The detailed technical manual. [01_CURRENT_STATE.md](01_CURRENT_STATE.md) and [07_TECH_DEBT.md](07_TECH_DEBT.md) draw from it directly and correct one known error in it (§12 SQL script filenames — see [07_TECH_DEBT.md](07_TECH_DEBT.md)). |
| `SECURITY-REPORT.md`, `docs/SECRET-ROTATION.md`, `docs/SECURITY-CHECKLIST.md` | Remain the authoritative security documents. [07_TECH_DEBT.md](07_TECH_DEBT.md) summarizes their critical findings but does not replace them — consult them directly for remediation detail. |
| `docs/GO-LIVE-PLAN.md`, `docs/EXECUTIVE-SUMMARY.md` | Sources for [01_CURRENT_STATE.md §10](01_CURRENT_STATE.md#10-current-priorities-in-order-per-readme--docsgo-live-planmd--manual-15) and [07_TECH_DEBT.md](07_TECH_DEBT.md). |
| `ai/context/*.md` (`business.md`, `project.md`, `architecture.md`, `design-system.md`, `roadmap.md`, `stack.md`) | **Superseded.** These were thin, template-style vision documents. [03_PRODUCT.md](03_PRODUCT.md) absorbs and expands `business.md`/`project.md`; [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) absorbs and expands `architecture.md`/`design-system.md`/`roadmap.md`; [01_CURRENT_STATE.md §2](01_CURRENT_STATE.md#2-stack) absorbs `stack.md`. Do not edit the `ai/context/` files going forward — edit `project-brain/` instead. `ai/context/current-state.md` and `ai/context/glossary.md` were found empty/unused during this audit. |
| `openspec/specs/*.md`, `openspec/changes/archive/*` | Remain the feature-level spec format for individual changes going through the SDD workflow. [01_CURRENT_STATE.md](01_CURRENT_STATE.md) and [04_DECISIONS.md](04_DECISIONS.md) reference specific specs/changes as evidence; they are not duplicated here in full. |
| `AGENTS.md` | The pre-existing, security-focused agent instruction file. [06_CLAUDE_RULES.md](06_CLAUDE_RULES.md) is broader in scope (architecture, product philosophy, not just security) and should be read first; `AGENTS.md`'s security checklist steps remain valid and complementary. |

## Maintenance rule

Whenever a `Planned` item in [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) is actually implemented, three things must happen in the same change: (1) move the fact into [01_CURRENT_STATE.md](01_CURRENT_STATE.md), (2) update the corresponding ADR's status in [04_DECISIONS.md](04_DECISIONS.md), and (3) add an entry to [08_CHANGELOG.md](08_CHANGELOG.md). A `Planned` item that quietly becomes real without these updates is exactly the kind of drift this Project Brain was created to prevent.
