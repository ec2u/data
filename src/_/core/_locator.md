---
title: Service Locator for Pipe Assembly
summary: a local scoped service locator, rather than an off-the-shelf DI container
description: |
  Working notes on service injection for taxonomy feeds: why the surveyed TypeScript DI containers do not fit pipe
  assembly, and how the local `_locator.ts` sketch maps onto the Java `com.metreeca.flow.Locator`.
---

# Verdict

A **local scoped service locator** of about 40 lines (`_locator.ts`), with no external dependency.

Services are declared as accessors over a default factory, resolved lazily, and overridden per execution scope through
`AsyncLocalStorage`.

```ts
export const vault = service<Vault>(() => error("undefined vault service"));

const url = await using([vault.with(envVault("EC2U_"))], sync);
```

# Why Not a Container

The injection point is a value handed to a task factory inside `pipe(…)`, not a constructor or a registration key, so
a container adds ceremony without removing any: the call site would read `map(container.get(FETCHER))`, which is what
the accessor already does.

# Shape

- `service(factory)` returns an accessor that doubles as the token, so no strings, decorators or abstract classes
- `accessor.with(value)` builds a binding; `using(bindings, task)` installs them for the duration of `task`
- values are held in a per-service `WeakMap` keyed by scope, so the registry types honestly with no casts
- scopes nest through `Scope.parent`, and unbound services memoise their default at `root`

Abstraction modules declare the type, the accessor and a failing default, with no implementation imports; entry points
bind the implementation, and tests bind a stub over the same accessor.

# Relation to the Java Locator

Same pattern as `com.metreeca.flow.Locator`, with `AsyncLocalStorage` in place of `ThreadLocal` and the accessor closure
in place of the `Supplier<T>` key.

| Java `Locator`                       | `_locator.ts`                                 |
|--------------------------------------|-----------------------------------------------|
| `service(store())`                   | `vault()`                                     |
| `new Locator().set(factory, plugin)` | `vault.with(value)`                           |
| `locator.exec(task)`                 | `using(bindings, task)`                       |
| `async(executor, task)`              | not needed, context propagates across `await` |

# Limits

- **No disposal**: nothing matches `Locator.close()` and its ordered shutdown of `AutoCloseable` services
- **No cycle detection**: a circular dependency recurses until the stack overflows, where the Java version reports it
- **Rebinding is silent**: `with()` overrides a resolved service, where `set()` throws `factory already in use`
- **Ambient fallback**: services resolve outside any scope and memoise at `root`, by design, since feeds are their own
  entry points

# References

- [Node.js Asynchronous Context Tracking](https://nodejs.org/api/async_context.html)
- [
  `com.metreeca.flow.Locator`](../../../../Products/Flow/flow-basics/flow-core/src/main/java/com/metreeca/flow/Locator.java)
