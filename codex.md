# Metreeca/Mesh Build Commands

## Build Commands

- `mvn clean install` - Full build with tests
- `mvn test` - Run all tests
- `mvn test -Dtest=TestClassName` - Run a specific test class
- `mvn test -Dtest=TestClassName#testMethodName` - Run a specific test method

## Code Style Guidelines

- Java code follows standard Java conventions
- Follow existing patterns for nested test classes with `@Nested` annotation
- Follow existing patterns for property naming in bean interfaces
- Imports: static imports for factory methods and constants
- Error handling: use checked exceptions with functional interfaces
- Naming: PascalCase for classes, camelCase for methods and variables
- Documentation: use Javadoc for public APIs
- Use final liberally for immutability

## Javadocs Guidelines

- Place Javadoc immediately before the documented element
- Use Javadoc only for public APIs unless required to do otherwise
- Introduce the class with a concise definition and a brief description of its purpose; keep the definition as short as
  possible
- Introduce boolean methods with "Checks if"
- Introduce read accessors with "Retrieves"
- Introduce write accessors with "Configures"
- Report unexpected null values as "@throws NullPointerException if <param> is {@code null}"; if two parameters are
  to be reported use "if either <param1> or <param2> is {@code null}"; if multiple parameters are to be reported use
  "if any of <param1>, <param2>, ..., <paramN> is {@code null}"
- Document record parameters with @param tags in the class description
- Don't generate example usage sections
- Don't generate javadocs for overridden methods

## Test Guidelines

- Test classes use JUnit 5 Jupiter (`org.junit.jupiter.api.Test`)
- Use AssertJ for test assertions (`assertThat()`)
- Tests follow BDD pattern with arrange-act-assert structure
- Tests don't cover trivial implementation details, like arguments null checks
