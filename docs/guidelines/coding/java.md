---
title: Java Guidelines
summary: Standards for Java coding and Javadocs documentation
---

# Code Style

- Java code follows standard Java conventions
- Follow existing patterns for nested test classes with `@Nested` annotation
- Follow existing patterns for property naming in bean interfaces
- Imports: static imports for factory methods and constants
- Error handling: use checked exceptions with functional interfaces
- Naming: PascalCase for classes, camelCase for methods and variables
- Documentation: use Javadoc for public APIs
- Use final liberally for immutability

# Javadocs

Documentation standards for Java APIs using Javadoc comments.

- Place Javadoc immediately before the documented element
- Use Javadoc only for public APIs unless required to do otherwise
- Introduce the class with a concise definition (not a description starting with "Represents") and a brief
  description of its purpose; keep the definition as short as possible
- Focus on functional responsibilities rather than implementation details
- Introduce boolean methods with "Checks if"
- Introduce read accessors with "Retrieves"
- Introduce write accessors with "Configures"
- Report unexpected null values as "@throws NullPointerException if <param> is {@code null}"; if two parameters are
  to be reported use "if either <param1> or <param2> is {@code null}"; if multiple parameters are to be reported use
  "if any of <param1>, <param2>, ..., <paramN> is {@code null}"
- Document record parameters with @param tags in the class description
- Definitely don't generate example usage sections
- Don't generate javadocs for overridden methods

## HTML Tags

- Always use open/close tag pairs (e.g., `<p>...</p>`)
- Keep HTML tags inline with text content, not on separate lines
- Add empty lines before and after block elements like `<p>`, `<ul>`, `<ol>`
- Use `{@code ...}` for inline code references instead of `<code>` tags

### Formatting Checklist

Before finalizing Javadoc, verify:

- [ ] Empty lines before each `<p>`, `<ul>`, `<ol>` tag
- [ ] Empty lines after each `</p>`, `</ul>`, `</ol>` tag
- [ ] Consistent lowercase bullet points in lists
- [ ] Proper `{@link}` references to related classes/methods
- [ ] All `@param` and `@return` tags documented
- [ ] Functional responsibilities described, not implementation details
