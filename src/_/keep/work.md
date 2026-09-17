---
title: Shape-Bound Retrieval
summary: How a retrieval states what it wants and where the type of the data it returns comes from.
description: Records why retrieval is composed against the shape it targets rather than typed from a model literal.
---

# Scope

Working notes on how `select` and `lookup` let a call site state what it wants and read back data that carries its type,
without restating the schema. Of the three questions marked in `work.ts`, they settle `shape+model >> type` and
`shape/model compatibility`.

Two routes were assessed: inferring the type from a model literal paired with its shape, and composing the model
against the shape in the first place. The second is the one taken; the first is recorded because it explains what the
second is buying.

The surface is sketched in [`dsl.ts`](./dsl.ts) and exercised in [`work.ts`](./work.ts); neither is implemented.

# Outcome

Retrieval is composed against a cursor materialised from the target shape. A call site states aliases and fields, the
cursor refuses anything the shape does not declare, and the data type is one mapped type over what the call site wrote.

| Question                    | Settled by                                                        |
|-----------------------------|-------------------------------------------------------------------|
| `shape >> model`            | the cursor: a model states only members the shape carries         |
| `shape+model >> type`       | the field tokens: each carries the type the shape resolved for it |
| `shape/model compatibility` | composition for an authored model, `compile` for a decoded one    |

# Why the Model Alone No Longer Carries the Type

The released `Instance<T>` resolves a result type from the template alone, because a leaf is a typed placeholder:
`name: ""` yields `string`, `price: 0` yields `number`, `tags: [""]` yields an array. The reworked model replaces those
with `Terminal`, an empty object branded by the `key` unique symbol, so a leaf now carries a position and nothing else.

Every value type therefore has to come from the shape. What remained open was when the shape is consulted: at the type
level, when a literal is checked, or at the value level, when the model is composed.

# The Route Not Taken: Inference Over a Literal

Pairing `shape` with a `model` literal and resolving `Instance<S, T>` is feasible for plain fields and dies on
projections.

**The shape type does not reach the inference.** `select<T extends Template>` is generic in the model alone, so
`shape: Page` widens to `Lazy<ResourceShape>` and the member table of `Page` is gone before inference starts. Making
the request generic in the shape is a precondition for anything further.

> [!NOTE]
> `@metreeca/keep` imports `Instance` and `Template` from `@metreeca/qest/template`, an entry point the installed
> `@metreeca/qest@0.10.0` does not declare (`.`, `./state` and `./model` only), and the shipped declarations name
> `Criteria` where the bundled sources still say `Selection`. The two packages are out of step.

**Plain fields resolve, at a price.** Driving the walk from the model terminates even against a cyclic shape, and every
step has a helper in `@metreeca/blue`: `Eager` unwraps a deferred shape, `Variant` splits a union range, `Localised` and
`Valued` hold locale maps apart, `Slot` and `Arity` apply cardinality. The price is `Carried<S>`, whose inheritance
merge runs over every parent and is re-instantiated at every nesting level of the model, which is where deep templates
meet the instantiation ceilings.

**Projections are where it stops paying.** An alias is free, since `Name<K>` already splits the key at the first `=`.
The expression behind it is not: `Path` and `Pipe` are declared as bare `string`, so both would have to become template
literal types, parsed recursively per binding, against a type-level twin of the `Transforms` table. Even then an empty
path has no shape to anchor on, an undeclared step resolves no further than `unknown`, and a domain violation surfaces
as `never` in an output position rather than as a diagnostic naming the binding.

# The Route Taken: Composition Against the Shape

The cursor is materialised from the shape once and memoised. Every member is a field carrying the type the shape
resolves for it, and every member ranging on a resource is also a node: navigable through its own members, expandable
through `select`, and usable as a value to bind the path reaching it.

```ts
const pages = await select(Page, page => ({

	id: page.id,
	digest: page.digest,

	...where(any(page.source, "https://example.edu/news"), limit(100))

}));
```

Criteria spread into the model exactly as the wire document carries them beside its fields, and the data leaves them
out.

## What It Settles

- **Cost**: `Carried<S>` is instantiated once per shape rather than once per nesting level, and the data type is one
  mapped type over the literal the call site wrote. The recursion moves from the type level to the value level, where
  it terminates by itself.
- **Expressions**: an alias is an object key and a transform is a function, so no path parser, no pipe parser and no
  type-level transform table are needed. `count(event.keywords)` yields a number because `count` says so.
- **Compatibility**: a member the shape does not declare is not on the cursor, so the error lands on the token the
  caller wrote instead of surfacing as `never` downstream.
- **Domains**: `sum` over text fails as an argument type error at the call site, which inference over a literal could
  only ever express as `never`.
- **Options**: qest concedes that its selection keys "sever the value form from the target property", leaving a
  dictionary against a plain property uncatchable. A field token restores the tie, so options are constrained by the
  type of the field they target.
- **Opacity**: union branch keys stay an implementation detail the caller never writes.

The typed-placeholder exception the literal route needed for computed slots is no longer required: every leaf stays
`{}`, and the regularity the model rework settled on is preserved.

## What It Costs

- **It authors the model, it does not replace it.** The wire document, the grammar and the runtime validator are
  untouched, and a model arriving from a client still has to be checked.
- **Two authoring surfaces.** A model feature without a cursor counterpart is unreachable through the builder, so the
  surface has to track the grammar.
- **Verbosity on the flat case.** A bare field list reads longer as a callback than as a literal, which a `pick`
  shorthand would recover.
- **The cursor has no driver.** Unlike a literal, it offers every path up front, so it needs a depth cap. That cap
  lines up with the `depth` option the store already admits.

## Decoded Models

A model arriving over the wire is not an escape hatch, it is a second input mode, and typing it by assertion would
undo what the cursor is for. `compile` checks the document against the shape when it is decoded, just as composition
checks an authored model when it is written, and `select` and `lookup` accept its result in place of a callback:

```ts
const decoded = await select(Page, compile(Page, document));
```

The data it yields is `Decoded<S>`: every plain field the document may state carries the type the shape resolves for
it, and a binding stays `unknown`, as the expression behind it is known only at run time. A call site wanting more
narrows through a guard of its own rather than through a type argument.

# Open Points

- **Node and leaf are the same object**: `event.publisher` is both navigable and a value, which is friendly to write
  and leaves the two roles told apart by position alone.
- **Expansion and path differ only by call**: `event.publisher.select(…)` expands, `event.publisher.label` binds a
  path. Whether that reads clearly enough without distinct names is unsettled.
- **Locale maps**: `field.at("en", "fi")` narrows to tag ranges; retrieving the whole map has no notation yet.
- **Unions**: branch selection has no counterpart on the cursor.
- **Placement**: the surface needs `@metreeca/blue` and `@metreeca/qest` together, which is where `@metreeca/keep`
  already sits.
