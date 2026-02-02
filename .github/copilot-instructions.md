# Copilot Instructions for QETTA Project

## Tech Stack
- Next.js 16 App Router
- React 19 with TypeScript 5
- Prisma 7 with PostgreSQL
- Zustand for state management
- Tailwind CSS 4
- Shadcn/ui components

## Code Style

### TypeScript
- Always use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Avoid `any` - use `unknown` if needed

### React
- Use 'use client' for interactive components
- Server components by default
- Avoid useState for shared state (use Zustand)

### Naming Conventions
- Components: PascalCase (UserProfile)
- Functions: camelCase (getUserById)
- Constants: UPPER_SNAKE_CASE (API_BASE_URL)
- Files: kebab-case (user-profile.tsx)

### Design System
- Color scheme: Zinc/White (Linear style)
- NO violet/purple colors
- Use shadcn/ui components

### API Routes
```typescript
// Always validate with Zod
const schema = z.object({
  name: z.string().min(1).max(100),
})

// Always handle errors
try {
  const result = await operation()
  return Response.json({ success: true, data: result })
} catch (error) {
  return Response.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}
```

## DO NOT
- Don't use `any` type
- Don't use `var`
- Don't ignore errors
- Don't use inline styles (use Tailwind)

## ALWAYS
- Validate input with Zod
- Handle errors gracefully
- Use TypeScript strict types
- Follow existing patterns
