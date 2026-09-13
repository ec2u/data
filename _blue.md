---
title: Blue shape factories
summary: Divergences of the ported Blue shapes from the EC2U model
description: Open divergences of the Blue shapes ported into Pipe from the EC2U model, the porting defects still to be closed, and the Blue limitations behind them.
---

# Divergences

How the ported Blue shapes depart from the EC2U model published by the sibling Data service. Every reference target the
model narrows is ported, except where an entry below records otherwise: those are blocked by one of the
[Blue limitations](#blue-limitations).

Each entry names the property, the definition the model specifies as `cardinality(target)`, and what the ported shape
carries instead.

## Offering

- `provider` — `optional(Organization)` embedded, ported as a reference to `schema.Organization`
  ([embedding overrides are refused](#embedding-overrides-are-refused)). `Course` and `Program` inherit the divergence.

## Organization

- Instances carry no `schema:Organization` class, which the local `schema` shapes do not declare.
- `subOrganizationOf`, `hasSubOrganization` — `multiple(Organization)`, left at `org.Organization`: an override
  targeting the very shape that declares it closes a circular definition. `Unit` and `University` narrow them on their
  own.
- `hasUnit` — `multiple(Unit)`, left at `org.OrganizationalUnit`: `Unit` extends `Organization`, so the override closes
  a circular definition. `University` narrows it.

## Topic

- `broader`, `broaderTransitive`, `narrower`, `related`, `exactMatch` — `multiple(Topic)`, left at `skos.Concept`: an
  override targeting the very shape that declares it closes a circular definition.
- `inScheme`, `topConceptOf` — `required(Taxonomy)` and `optional(Taxonomy)`, left at `skos.ConceptScheme`.
- `dataset` — `required(Taxonomy)`, left at `Dataset`. `Taxonomy` already narrows the opposite direction, and refining
  both ends closes a circular definition.

## Unit

- `hasUnit` — `multiple(Unit)`, left at `org.OrganizationalUnit`: `Unit` is the very shape carrying the override, so it
  closes a circular definition.

# Blue Limitations

Refining an inherited member is what the port leans on throughout, and it carries most of the model as stated. An
inherited reference re-points at a target extending the inherited one:
`resource(Parent, { ref: required(reference(Narrower)) })` merges to `Narrower` where `Parent.ref` targets `Wider`, and
the inherited definition reaches the narrower target through its own `extends` chain. Targets are matched by structure
alone, so how either end names its shape makes no difference: the uncalled factory `reference(Narrower)`, the arrow
thunk `reference(() => Narrower())` and an already built shape all compare equal. An unrelated target compiles and fails
only at run time, as `incompatible resource shape override <[{"ref": ["{target} incompatible <target> override"]}]>`.

The sections below record where the refinement stops.

## Embedding overrides are refused

Swapping an inherited reference for an embedded resource fails as
`incompatible resource shape override <[{"ref": ["{kind} mismatched kinds <resource> vs <reference>"]}]>`. A member
admits an embedded resource only where the shape declaring it says so, so a model that embeds what a parent links has to
be met on the parent rather than on the extending shape. `schema.Thing.image` is stated as an embedded
`ImageObject` for that reason, `Event` having no way to embed it on its own.

```typescript
const ns = createNamespace("https://example.org/", [ "label", "link" ]);

function Target() {
	return resource({ label: optional(string) }, { space: ns });
}

function Parent() {
	return resource({ link: optional(reference(Target)) }, { space: ns });
}

function Embedding() {
	return resource(Parent, { link: optional(Target) });
}

Embedding(); // RangeError: incompatible resource shape override
             // <[{"link": ["{kind} mismatched kinds <resource> vs <reference>"]}]>
```

## Arity caps drop the member from the projected type (fixed in part, blue f30ce9f)

Cardinality is refinable within the same arity, but not across it. Raising a minimum count ports unchanged; capping an
inherited set at a single value passes the override check, but the member then drops out of the projected value type
altogether, so nothing can state it. The two ends disagree, and the shape builds clean, so a capped member is found only
when the value carrying it fails to compile.

```typescript
function Parent() {
	return resource({ links: multiple(reference(Target)) }, { space: ns });
}

function Raised() { // same arity: ports unchanged
	return resource(Parent, { links: nonempty(reference(Target)) });
}

function Capped() { // across arity: builds, but the member is gone from the projection
	return resource(Parent, { links: optional(reference(Target)) });
}

Object.keys(Capped().members);                         // ["links"] — the shape still carries it

const links: Compound<typeof Capped>["links"] = "…";   // error TS2339: Property 'links'
                                                       // does not exist on type '{}'
```

**Fixed** in blue `f30ce9f`, the disappearance alone. An override the inherited member does not admit is voided on
purpose, so that the conflict surfaces where the state is resolved; the filter leaving foreign members out of a compound
took the voided one for a foreign one, every type being a foreign member vacuously, and dropped it. A voided member is
now owned like any other, so `Compound<typeof Capped>["links"]` is `never` rather than absent, reporting the conflict
where the member is stated. `Instance` already did so, and the two projections now agree.

**Not a defect**, the cap itself. Cardinality is refinable within an arity and not across it, because crossing it would
swap a bare value for an array and break every value already stating the member. The runtime override check is the end
that is wrong to let it through, so a capped member still builds clean and voids only in the projection; tightening the
assembler to refuse it is tracked separately.

## Self-reaching overrides close a circular definition (fixed in blue fc12bdf)

Shapes are declared as functions rebuilt on every call, and the override resolves both ends eagerly. Re-pointing a
property at a target that extends the shape carrying the override fails as
`circular definition <[{"Unit": ["reaches itself"]}]>`, which is what blocks `Organization.hasUnit` and `Unit.hasUnit`.
Refining both ends of a pair that point at each other fails the same way, so a mutually referencing pair admits one
refined direction only: `Taxonomy` narrows towards `Topic`, and `Topic` is left at the shapes it inherits.

Each narrowing below is admissible on its own, the new target extending the inherited one, and the pair still fails:

```typescript
const ns = createNamespace("https://example.org/", [ "member", "scheme" ]);

function SchemeBase() {
	return resource({ member: multiple(reference(ConceptBase)) }, { space: ns });
}

function ConceptBase() {
	return resource({ scheme: required(reference(SchemeBase)) }, { space: ns });
}

function Scheme() {
	return resource(SchemeBase, { member: multiple(reference(Concept)) });
}

function Concept() {
	return resource(ConceptBase, { scheme: required(reference(Scheme)) });
}

Scheme();  // RangeError: circular definition <[{"Concept": ["reaches itself"]}]>
Concept(); // RangeError: circular definition <[{"Scheme": ["reaches itself"]}]>
```

Dropping either refinement builds both ends.

The failure is raised where the shape factory is **called**, so neither `tsc` nor a suite that never builds the shape
reports it, and it reaches every shape extending or pinning through either end: one mutual refinement takes out most
of the vocabulary while the build stays green.

**Fixed** in blue `fc12bdf`. There was no loop to report: whether the new target extends the inherited one is read off
the target's own parent chain, and a link is deferred exactly so a definition may reach itself. The chain was reached
through the resolver, which merges, and merging re-ran the same check, so the check was the one place forcing what the
deferral exists to postpone. A target whose resolution is already under way is now left to that resolution, which states
the chain the answer is read off; the enclosing frame reads the same chain once it stands, so a target extending nothing
the inherited one names is still reported as an incompatible override.

Both shapes in the example build, `Organization.hasUnit`/`Unit.hasUnit` included, and a mutually referencing pair now
admits both refined directions: `Topic` need no longer be left at the shapes it inherits.

Worth knowing for the next reader: the check tells a target under resolution from one it may resolve in its own right
through the record the resolver already keeps of what it is resolving. That reading is an artefact of the merge being
eager, not of the question, which is purely syntactic. Were the merge deferred to first resolution, the chain could be
walked from the declared shape with no such reading at all, at the cost of moving override errors from the declaration
site to first use.
