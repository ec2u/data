---
title: Typed State Walks
summary: The @metreeca/blue change that would make the state walker cast-free, drafted as a feature request.
description: |
  Why the state walker casts each value to the state of the branch it matched, and the draft of the feature request to
  file on @metreeca/blue so that the branch accessor returns the pairing itself and the cast goes away.
---

# Scope

`resource.ts` pairs each value a validated state holds with the branch shape it matches. It resolves the branch with
`getStateBranch`, which validates the value against every branch and returns the one admitting it, but types the value
no further. The walker therefore casts the value to the state of that branch, on the strength of the validation the
accessor has just run.

The cast is sound, but it restates a fact the accessor already established. The request below asks the accessor to
return that fact instead. Once it does, the walker drops the cast and derives its entry type from the accessor's result.

# Feature Request

Draft for [metreeca/blue](https://github.com/metreeca/blue/issues/new?template=feature.md), following the repository
feature template.

## Title

Return the matched branch paired with the value typed as its state

## Body

**challenge / use case**

A caller walking a validated state against its shape routes each value to the union branch it belongs to with
`getStateBranch(value, getShapeBranches(range.shape))`. The accessor validates the value against every constraint of
the branch it returns, so at that point the value is known to be the `State` of that branch. The return type keeps
none of this: it hands back the bare branch, and the value stays `unknown`.

The caller is left with two options, both poor. It casts the value to `State<typeof branch>`, restating what the
accessor just proved; or it re-guards the value with `isBoolean`, `isString` and the like, which duplicates the
validation and still falls short, as the qest `isDictionary` guard admits the loose `string | string[]` tag values
while `State<DictionaryShape>` is the normalised `readonly string[]` form.

Any typed, shape-driven consumer hits this: RDF framing, SPARQL encoding, form binding. Each ends up carrying the same
cast at the same spot.

**proposal**

Let the accessor return the branch together with the value it admitted, typed as the state of that branch:

```typescript
type Match<B extends Shape> = B extends Shape ? {
	readonly kind: B["kind"];
	readonly shape: B;
	readonly value: State<B>;
} : never;

function getStateBranch<B extends Shape>(state: unknown, branches: readonly B[]): Optional<Match<B>>;
```

The result is a discriminated union over the branch kinds, so narrowing on `kind` narrows `shape` and `value`
together and a consumer dispatches on it with a plain `switch`. The one cast moves inside the accessor, next to the
validation that justifies it.

**alternatives**

- Keep `getStateBranch` as it is and add the pairing as a sibling accessor, so the two current callers in
  `keep-sparql` reading the result as a bare shape stay untouched.
- Export a `Match<B>` type alone and leave the pairing to callers: this keeps the cast in every consumer and gains
  nothing.
- Expose a type guard `isState(value, branch): value is State<B>`: a guard over a union-typed branch yields the union
  of all branch states, not the one matching the branch, so it does not correlate the two.

**notes**

The same pairing serves `getBoundBranch` and `getOptionBranch` where a caller needs the operand typed by the branch it
resolved to, though those match on syntactic traits alone and admit no claim about the value, so they are out of scope
here.
