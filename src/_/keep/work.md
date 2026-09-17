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
with `Atomic`, an empty object branded by the `key` unique symbol, so a leaf now carries a position and nothing else.

Every value type therefore has to come from the shape. What remained open was when the shape is consulted: at the type
level, when a literal is checked, or at the value level, when the model is composed.

# The Route Not Taken: Inference Over a Literal

Pairing `shape` with a `model` literal and resolving `Instance<S, T>` is feasible for plain fields and dies on
projections.

**The shape type does not reach the inference.** `select<T extends Template>` is generic in the model alone, so
`shape: Page` widens to `Lazy<ResourceShape>` and the member table of `Page` is gone before inference starts. Making
the request generic in the shape is a precondition for anything further.

> [!NOTE]
> `@metreeca/keep` imports `Instance` and `Template` from `@metreeca/qest/model`, and the installed qest no longer
> exports `Instance`: the reworked module withdraws the inference utilities outright. The two packages are out of step.

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

# The Types a Shape Resolves

A shape answers two questions, and a call site meets both:

| Type                | Answers                                | Paired with                                  |
|---------------------|----------------------------------------|----------------------------------------------|
| `Instance<S>`       | what the shape yields                  | the state a writer submits                   |
| `Model<S>`          | what the shape admits being asked for  | the request a reader states                  |
| `Delivery<S, M>`    | what a given model hands back          | neither; it eliminates the pair              |

Read as duals, `Instance<S>` and `Model<S>` bracket the exchange: one states everything the shape carries, the other
everything a caller may ask of it. `Delivery<S, M>` then resolves the pair, so the type a call site reads back is never
wider than what it asked for and never wider than what the shape declares.

`Model<S>` does not yet meet that definition. It is stated as a union of the two ways a model is **written**, a cursor
traversal or a compiled document, rather than as the templates the shape **admits**. The consequences are visible at
the call site:

- Only a traversal is held to the shape at compile time. A compiled document satisfies `Compiled<S>` for any shape, so
  a document naming members the shape does not carry is refused when it is decoded rather than where it is written.
- `Delivery<S, M>` needs a conditional to tell the two arms apart, rather than reading a single well-formed model.

Defining `Model<S>` structurally, as `Template` narrowed to the members the shape carries and recursing through their
ranges, would close both. The cursor then becomes one way of producing a value of that type rather than its definition,
and `Delivery<S, M>` becomes a walk over the shape and the model together, which is what
[`inference.ts`](./inference.ts) already sketches and nothing currently calls.

# Open Points

- **Node and leaf are the same object**: `event.publisher` is both navigable and a value, which is friendly to write
  and leaves the two roles told apart by position alone.
- **Expansion and path differ only by call**: `event.publisher.select(…)` expands, `event.publisher.label` binds a
  path. Whether that reads clearly enough without distinct names is unsettled.
- **Locale maps**: `field.at("en", "fi")` narrows to tag ranges; retrieving the whole map has no notation yet.
- **Unions**: branch selection has no counterpart on the cursor, and a path cannot reach through one. A property
  ranging on a union offers no member to carry on with, so `event.location.name` is refused even where every branch
  declares `name`. Offering the members the branches share needs the member table resolved per branch, which exceeds
  the instantiation ceiling on shapes of this depth; even then a member only one branch declares stays unreachable,
  and a branch that is itself a union is not unfolded again.
- **Placement**: the surface needs `@metreeca/blue` and `@metreeca/qest` together, which is where `@metreeca/keep`
  already sits.
