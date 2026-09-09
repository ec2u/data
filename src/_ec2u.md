---
title: Blue shape factories
summary: Divergences of the ported Blue shapes from the EC2U model
description: Open divergences of the Blue shapes ported into Pipe from the EC2U model, the porting defects still to be closed, and the Blue limitations behind them.
---

# Divergences

How the ported Blue shapes depart from the EC2U model published by the sibling Data service. Every reference target
the model narrows is ported, except where an entry below records otherwise: those are blocked by
[reference refinement stops at embedding, arity and cycles](#reference-refinement-stops-at-embedding-arity-and-cycles),
or wait on the pinned `Topic` shapes the id patterns need, which the taxonomies they pin to do not yet have.

Each entry names the property, the definition the model specifies as `cardinality(target)`, and what the ported shape
carries instead.

## Event

- `about`, `audience` — `multiple(Topic)` ported without the id patterns pinning them to the EC2U events and
  stakeholders taxonomies.
- `image` — `optional(ImageObject)` embedded, ported as a captive reference on `schema.Event`
  ([captive references project to a bare IRI](#captive-references-project-to-a-bare-iri)).

## Offering

- `educationalLevel`, `about` — `multiple(Topic)` ported without the id patterns pinning them to the ISCED 2011 and
  ISCED-F 2013 taxonomies.
- `provider` — `optional(Organization)` embedded, ported as a reference to `schema.Organization`. `Course` and
  `Program` inherit the divergence.

## Organization

- Instances carry no `schema:Organization` class, which the local `schema` shapes do not declare.
- `classification` — `multiple(Topic)` ported without the id pattern pinning it to the EC2U organizations taxonomy.
- `subOrganizationOf`, `hasSubOrganization` — `multiple(Organization)`, left at `org.Organization`: an override
  targeting the very shape that declares it closes a circular `extends` chain. `Unit` and `University` narrow them on
  their own.
- `hasUnit` — `multiple(Unit)`, left at `org.OrganizationalUnit`: the inherited target is reached through a thunk, so
  the lineage never matches by structure. `Unit` and `University` are blocked the same way.

## Topic

- `broader`, `broaderTransitive`, `narrower`, `related`, `exactMatch` — `multiple(Topic)`, left at `skos.Concept`: an
  override targeting the very shape that declares it closes a circular `extends` chain.
- `inScheme`, `topConceptOf` — `required(Taxonomy)` and `optional(Taxonomy)`, left at `skos.ConceptScheme`.
- `dataset` — `required(Taxonomy)`, left at `Dataset`. `Taxonomy` already narrows the opposite direction, and refining
  both leaves the two ends resolving each other until the stack is spent.

## Unit

- `classification` — `multiple(Topic)` ported without the id pattern pinning it to the EC2U organizations taxonomy.

## University

- `classification` — `multiple(Topic)` ported without the id pattern pinning it to the EC2U organizations taxonomy.
- `dataset` — not constrained to the universities namespace.

# Blue Limitations

## Shape cycles infer by declaration order

A cycle closed by an `extends` edge infers only when the extending shape is declared before the parent it extends;
otherwise both ends fail with `TS7023: 'Dataset' implicitly has return type 'any' because it does not have a return
type annotation and is referenced directly or indirectly in one of its return expressions`. Cycles closed purely by
references infer at any order and any length.

Ordering carries most of the vocabulary: `OrganizationalUnit` precedes `Organization`, `ImageObject` precedes `Thing`.
It stops short where the parent also references the extending shape back, closing a second cycle through the two
reference edges that no declaration order untangles: `Organization.hasUnit` is cut with an explicitly annotated
`reference((): ResourceShape => …)` thunk for that reason. The same cut applies where a cycle closes through a shape
declared in another module and there is no ordering knob at all, as `Resource.dataset` and `Resource.university` do. The
annotation carries no type cost: `reference()` types its target as `Lazy<ResourceShape>` in any case.

Cut the reference edge, never the `extends` edge: annotating a parent as `ResourceShape` compiles silently and empties
every inherited entry.

## Captive references project to a bare IRI

A captive reference accepts either an IRI or the target resource inline: `validateReferenceElement`
(`Packages/Blue/src/resource.core.ts:855`) validates an object value against the target shape whenever `captive` is set.
`State<>` admits only the IRI, since it resolves through `Instance<Schema<S>>` and a reference carries the `app` model
whatever its target, so the inline form has no type to name. Writing a captive target inline therefore takes a cast.

`Event.image` is where this bites: the event converter (`src/events/tasks/convert.ts:103`) can populate the image IRI
but not the `caption`, `author` and `copyrightNotice` that come with it, so the extracted image credits are dropped.

## Reference refinement stops at embedding, arity and cycles

An inherited reference re-points at a target extending the inherited one:
`resource({ extends: Parent }, { ref: required(reference(Narrower)) })` merges to `Narrower` where `Parent.ref` targets
`Wider`, and the inherited definition reaches the narrower target through its own `extends` chain. An unrelated target
compiles and fails only at run time, as
`incompatible resource shape override <[{"link": ["{shape} incompatible <shape> override"]}]>`.

Swapping an inherited reference for an embedded resource fails as `{kind} mismatched kinds <resource> vs <reference>`,
so embedding overrides stay out of reach.

Cardinality is refinable within the same arity, but not across it: the projected value type follows from arity, so
raising a minimum count ports unchanged, while capping an inherited set at a single value does not. Only the projected
type rejects the narrowing; the override check itself accepts it.

Cycles close the remaining ground, since shapes are declared as functions rebuilt on every call and the override
resolves both ends eagerly. Re-pointing a property at the very shape that declares it fails as
`circular extends chain <[{"Organization": ["circular dependency"]}]>`. Refining both ends of a pair that point at
each other exhausts the stack with `RangeError: Maximum call stack size exceeded`, naming no property, so a mutually
referencing pair admits one refined direction only.

A thunk on the path defeats the check outright. The lineage is matched by structure, and `reference(() => …)` builds a
fresh closure on every call, so two builds of a shape carrying a thunk never compare equal: any target reached through
one is rejected as `{shape} incompatible <shape> override`, however the hierarchy actually reads.
