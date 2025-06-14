# BrightBroom Project Guidelines

## Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run TypeScript checks
- `npm run test` - Run tests with Vitest
- `npm run test -- path/to/test.ts` - Run a single test file
- `npm run lint` - Run ESLint on .js, .ts, .svelte files
- `npm run format` - Format code with Prettier

## Database Commands

- `npm run db:start` - Start PostgreSQL in Docker
- `npm run db:generate` - Generate new migration from schema changes
- `npm run db:migrate:dev` - Apply migrations (development)
- `npm run db:seed` - Seed database with test data

## Code Style Guidelines

- **TypeScript**: Use strict mode, proper typing for all variables and functions
- **Imports**: Use `$lib/` aliased imports, group imports (Svelte, external, internal)
- **Component Organisation**: Feature-based folder structure following SvelteKit conventions
- **Naming**: Use PascalCase for components, camelCase for variables/functions
- **Error Handling**: Use typed errors from `$lib/utils/errors.ts`
- **Testing**: 80% coverage goal, use Vitest for unit/component tests
- **Styling**: Use Tailwind with custom theme; avoid inline styles
- **Form Validation**: Use Zod schemas for validation
- **Accessibility**: Ensure all components meet WCAG standards
