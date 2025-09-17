---
title: TypeScript Guidelines
summary: Standards for TypeScript coding and TypeDoc documentation
---

# Code Style

- Use strict TypeScript configuration with all strict compiler options enabled
- Prefer `const` declarations over `let` when variables won't be reassigned
- Use PascalCase for component names and exported constants
- Use camelCase for functions, variables, and file names
- Prefer named exports over default exports
- Use destructuring assignments for object and array access
- Implement functional components over class components

# Imports and Exports

- Use absolute imports with path aliases for internal modules
- Group imports in this order:
    1. Third-party libraries
    2. Internal modules (using absolute paths)
    3. React imports
    4. CSS imports (relative paths)
- Use named exports for components and utilities
- Prefer named exports over default exports for consistency

# Type Definitions

- Define interfaces and types explicitly for all public APIs
- Use union types for restricted value sets
- Mark optional properties with `?` syntax
- Use generic types for reusable components and utilities
- Leverage utility types (`Partial`, `Pick`, `Omit`) when appropriate
- Define custom type guards for runtime type checking

# Component Structure

- Use functional components with TypeScript
- Define component props with interfaces
- Use consistent naming conventions for components
- Implement React hooks for state management
- Separate business logic from presentation components

# Styling Integration

- Create component-scoped CSS files alongside TypeScript files
- Use CSS modules or styled-components for component styling
- Import CSS using relative paths
- Use semantic class names and avoid styling conflicts
- Leverage CSS custom properties for theming

# State Management

- Use React hooks for state management (`useState`, `useEffect`, `useContext`)
- Implement custom hooks for reusable stateful logic
- Consider state management libraries for complex applications
- Integrate data fetching with component lifecycle through hooks

# Error Handling

- Leverage TypeScript's strict null checks
- Use type guards for runtime type validation
- Implement proper error boundaries for component failures
- Handle async operations with proper error states
- Use `try-catch` blocks for error handling in async functions

# File Organization

- Use descriptive file names that reflect their purpose
- Organize files by feature or domain when appropriate
- Place reusable components in shared directories
- Use index files for clean imports
- Keep file names consistent with export names

# TypeDoc Documentation

- Document public APIs and exported functions
- Use JSDoc syntax compatible with TypeDoc
- Include parameter and return type descriptions
- Document component props and their purposes
- Provide usage examples for complex utilities
- Keep documentation concise and focused on usage
