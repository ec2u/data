---
title: Blue shape factories
summary: Divergences of the ported Blue shapes from the EC2U model
description: Open divergences of the Blue shapes ported into Pipe from the EC2U model, the porting defects still to be closed, and the Blue limitations behind them.
---

# Divergences

How the ported Blue shapes depart from the EC2U model published by the sibling Data service. Every entry below is an
instance of
[reference targets and embedding kinds cannot be refined](#reference-targets-and-embedding-kinds-cannot-be-refined),
except where noted: the inherited property keeps the target its parent declared, and any id pattern narrowing it goes
with it.

## Course

- `audience`, `instructor` — target `skos.Concept` and `foaf.Person` instead of the EC2U `Topic` and `Person`.

## EducationalOccupationalProgram

- `hasCourse` — targets `schema.Course` instead of the EC2U `Course` dataset shape.

## Event

- `publisher`, `about`, `audience` — target `schema` and `skos` shapes instead of the EC2U families, dropping the id
  patterns pinning `about` and `audience` to the EC2U events and stakeholders taxonomies.

## Offering

- `provider`, `educationalLevel`, `about` — target `schema` and `skos` shapes instead of the EC2U families, dropping the
  id patterns pinning `educationalLevel` and `about` to the ISCED taxonomies.

## Organization

- Extends `[Resource, org.Organization]` only: `schema.Organization` cannot join the parents, as `identifier` would come
  in as `schema:identifier` against the inherited `org:identifier`
  ([multiple inheritance rejects a property inherited under two different IRIs](#multiple-inheritance-rejects-a-property-inherited-under-two-different-iris)).
  The other `schema` properties are duplicated locally, and instances carry no `schema:Organization` class.
- `subOrganizationOf`, `hasSubOrganization`, `hasUnit`, `hasHead`, `hasMember`, `classification` — target `org`, `foaf`
  and `skos` shapes instead of the EC2U families, dropping the id pattern pinning `classification` to the EC2U
  organizations taxonomy.

## Taxonomy

- `resources`, `hasConcept`, `hasTopConcept` — `resources` targets the EC2U `Resource` and `hasConcept`/`hasTopConcept`
  target `skos.Concept`, in place of the intended `Topic` narrowing.

## Topic

- `inScheme`, `topConceptOf` — target `skos.ConceptScheme` instead of the EC2U `Taxonomy`.
- `broader`, `broaderTransitive`, `narrower`, `related`, `exactMatch` — target `skos.Concept` instead of the EC2U
  `Topic`.
- `dataset` — targets `Dataset` instead of the narrower `Taxonomy`.

## Unit

- `unitOf` — targets `org.Organization` instead of the EC2U `Organization`.
- `hasUnit` — targets `org.OrganizationalUnit` instead of the EC2U `Unit`.

## University

- `classification` — drops the id pattern pinning it to the EC2U organizations taxonomy, which would take a narrowed
  `Topic` shape carrying an id `pattern`.

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

## Reference targets and embedding kinds cannot be refined

`resource({ extends: Parent }, { ref: required(reference(Narrower)) })`, where `Parent.ref` targets `Wider`, throws
`incompatible resource shape override <[{"ref": ["{shape} unexpected <shape> redefinition"]}]>`: Blue documents the
reference `shape` field as non-overridable. Swapping an inherited reference for an embedded resource fails as
`{kind} mismatched kinds <resource> vs <reference>`, so embedding overrides are equally out of reach.

Cardinality is refinable within the same arity, but not across it: the projected value type follows from arity, so
raising a minimum count ports unchanged, while capping an inherited set at a single value does not.

When the override re-points an inherited self-reference at the overriding shape itself, `narrowsReference`
(`Packages/Blue/src/reference.core.ts:47`) resolves each end repeatedly until `RangeError: Maximum call stack size
exceeded`, naming no property; targets that merely point back into the hierarchy fail with the ordinary message.

## Multiple inheritance rejects a property inherited under two different IRIs

Two parents declaring the same property name in different namespaces fail with `{forward} unexpected <forward>
redefinition`, with no way to pick a winner short of dropping a parent.
