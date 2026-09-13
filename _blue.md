---
title: Blue shape factories
summary: Open divergences of the ported Blue shapes from the EC2U model
description: Divergences of the Blue shapes ported into Pipe from the EC2U model still to be closed, and the Blue defects recorded against the port.
---

# Divergences

How the ported Blue shapes still depart from the EC2U model published by the sibling Data service. Each entry names the
property, the definition the model specifies as `cardinality(target)`, and what the ported shape carries instead. Every
narrowing Blue admits has landed, so an entry naming a defect is one that defect blocks.

Checked against blue `0708cc6`: every shape factory in the project builds, the suite is green, and both defects below
still reproduce.

## Organization

- `hasUnit` — `multiple(Unit)`, left at `org.OrganizationalUnit`
  ([`Organization` cannot re-point `hasUnit` at `Unit`](#organization-cannot-re-point-hasunit-at-unit)). `Unit` and
  `University` narrow it.

# Blue Defects

## A union member inherited twice cannot be merged

Merging a union with itself fails. A shape extending two parents that both inherit the same union member resolves that
member twice, and each branch is then matched against every inherited branch. Where two branches are of the same kind,
two values or two resources, each matches more than one and the merge is refused:

```typescript
function Location() { return union(text, string); }

function Owner() { return resource({ location: optional(Location()) }, { space: ns }); }

function Left() { return resource(Owner, {}); }
function Right() { return resource(Owner, {}); }

function Child() { return resource(Left, Right, {}); }

Child();  // RangeError: incompatible resource shape override
          // <[{"location": [{"0": ["branch narrows several inherited branches"],
          //                  "1": ["branch narrows several inherited branches"]}]}]>
```

What stays clear of the defect: a reference shields the union, the referenced shape never being merged; a single-parent
chain builds at any depth; and a union whose branches are each of a different kind, `union(text, Place)` for one, merges
through the same pair of parents unharmed.

Nothing in the port reaches it as it stands: the only union the vocabulary declares is `schema.Location`, and the shapes
carrying it, `schema.Organization.location` and `schema.Event.location`, are reached through a reference or a
single-parent chain. It bites the moment a union lands on a shape two parents share, or inside a shape embedded in one.

## Organization cannot re-point `hasUnit` at `Unit`

Narrowing `Organization.hasUnit` to `Unit` fails as `circular definition <[{"Unit": ["reaches itself"]}]>`, `Unit`
extending `Organization`. The failure is raised where the shape factory is **called**, so neither `tsc` nor a suite that
never builds the shape reports it, and it reaches `Unit` and `University` as well. Which shape reports it follows the
build order: the first factory called fails, and shapes built after it in the same process can come back clean.

The declaration alone is not the trigger: the inherited target has to extend the shape declaring the member, as
`org.OrganizationalUnit` extends `org.Organization`, and the narrowed target has to extend the shape carrying the
override:

```typescript
function OrgBase() { return resource({ hasUnit: multiple(reference(UnitBase)) }, { space: ns }); }
function UnitBase() { return resource(OrgBase, {}); }

function Org() { return resource(OrgBase, { hasUnit: multiple(reference(Unit)) }); }
function Unit() { return resource(Org, UnitBase, {}); }

Org();   // RangeError: circular definition <[{"Unit": ["reaches itself"]}]>
Unit();  // RangeError: circular definition <[{"Org": ["reaches itself"]}]>
```

Drop either condition and the override merges: with `UnitBase` standing on its own the pair builds, and so does a
`Unit` extending `UnitBase` alone. Cardinality makes no difference. That last case is why `University` narrows `hasUnit`
without complaint: `Unit` extends `Organization`, not `University`.
