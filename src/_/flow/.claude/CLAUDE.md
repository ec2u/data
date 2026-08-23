# References

- [@metreeca/pipe](https://github.com/metreeca/pipe) - TypeScript library for processing async iterables with
  composable, type-safe pipelines

# Notes

- `@types/jsdom`, pulled in by this tree, references `lib.dom`, typing fetch responses against the DOM
  `ReadableStream`: `tsconfig.json` compensates with the `DOM.AsyncIterable` lib entry, to be removed when this tree is
  decoupled and jsdom leaves the dependency graph
