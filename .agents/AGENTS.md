# GUIDELINES FOR FUTURE AGENTS - FLASHCARD LEARNING PROJECT

Refer to [PROJECT_CONTEXT.md](file:///c:/Users/admin/Documents/FPT_Source/SM26/Learning_Source/PROJECT_CONTEXT.md) for full architectural background, completed Phase 1 details, and roadmap for Phase 2, 3, and 4.

## Core Rules for Next Developers / Agents:
1. **Server-side Security**: Every write/update/delete action under admin MUST invoke `await verifyAdminSession()` from `@/lib/auth`.
2. **Prisma ORM**: The project uses Prisma v6.4.0. Always run `npm run db:generate` when updating `schema.prisma`.
3. **Quality Gates**: Always ensure the following three checks pass before declaring work done:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm run build`
