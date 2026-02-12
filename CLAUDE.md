# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Writer is an AI-powered writing assistant website (写作AI Agent) that helps users quickly generate articles. It features workspace management for focused context isolation, rich text editing, and article export capabilities.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Technology Stack

- **Framework**: Next.js 16+ (App Router)
- **UI**: Tailwind CSS v4 + Shadcn/UI components
- **Editor**: Tiptap rich text editor (extensions: placeholder, starter-kit)
- **Icons**: Lucide React
- **Language**: TypeScript (strict mode, `any` types are prohibited)

## Code Style Requirements

- **TypeScript**: Strict mode enabled, never use `any` type
- **Component Style**: Functional components with hooks
- **Path Aliases**: Use `@/*` for imports from project root
- **Database Table Names**: Always use singular form (e.g., `user`, `workspace`, `article`), not plural

### Development Principles

#### 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:
• State your assumptions explicitly. If uncertain, ask.
• If multiple interpretations exist, present them - don't pick silently.
• If a simpler approach exists, say so. Push back when warranted.
• If something is unclear, stop. Name what's confusing. Ask.

#### 2. Simplicity First
Minimum code that solves problem. Nothing speculative.

• No features beyond what was asked.
• No abstractions for single-use code.
• No "flexibility" or "configurability" that wasn't requested.
• No error handling for impossible scenarios.
• If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

#### 3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:
• Don't "improve" adjacent code, comments, or formatting.
• Don't refactor things that aren't broken.
• Match existing style, even if you'd do it differently.
• If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
• Remove imports/variables/functions that YOUR changes made unused.
• Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to user's request.

#### 4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:
• "Add validation" → "Write tests for invalid inputs, then make them pass"
• "Fix bug" → "Write a test that reproduces it, then make it pass"
• "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Application Architecture

The app follows a three-zone layout:

1. **Left Sidebar** - Workspace selection and management (create, switch, delete workspaces)
2. **Top Input Bar** - User input for AI generation prompts
3. **Bottom Creative Zone** - Rich text editor with export functionality (Markdown/HTML/Plain text)

### Data Model

Located in `/types/index.ts`:

- `Workspace` - Isolated work context with settings (targetReader, referenceExample)
- `Article` - Generated content linked to a workspace
- `AppState` - Global state with workspaces, currentWorkspaceId, and articles map
- `ExportFormat` - Supported export types: 'markdown' | 'html' | 'plain'

### Data Persistence

All data is persisted to localStorage via `/lib/storage.ts`:
- Workspaces, articles, and app state are saved automatically
- Article content auto-saves on editor changes
- No backend/API layer in current MVP

### Key Components

- `/app/page.tsx` - Main client component managing global state and coordinating all features
- `/components/layout/MainLayout.tsx` - Main layout template
- `/components/workspace/` - Workspace CRUD operations
- `/components/input-bar/` - User input interface
- `/components/creative-zone/` - Tiptap editor with export functionality
- `/components/ui/` - Shadcn/UI base components

### AI Integration (Placeholder)

The current AI generation is simulated with `setTimeout`. Real AI integration needs to be implemented.

## Shadcn/UI Configuration

Located in `/components.json`:
- Style: "new-york"
- Components installed: Tabs, Dialog, Select, Button, Card, Sidebar, and more
- Uses CSS variables for theming
- Lucide icons for all icon components

When adding new Shadcn/UI components, use the CLI: `npx shadcn add <component-name>`
