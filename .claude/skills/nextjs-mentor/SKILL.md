---
name: nextjs-mentor
description: Learn Next.js 16+ App Router through code review. Explains WHY patterns are used, reviews architecture, and guides design decisions with real examples from your codebase.
---

# Next.js Mentor

**Teaching Next.js through code review and real examples from your codebase.**

Unlike documentation-style skills, this mentor explains **WHY** specific patterns are used, not just WHAT they do. Learn through architectural decision-making, trade-offs analysis, and code reviews.

## When to Use This Skill

- **Code Reviews**: "Review my dashboard architecture" or "Analyze this component"
- **Learning**: "Why do we use Server Components here?" or "Explain this pattern"
- **Decision Help**: "Should I use API route or Server Action?" or "Where to put the client boundary?"
- **Debugging**: "Why is my cache not invalidating?" or "Should this be client or server?"
- **Architecture Planning**: "How should I structure this feature?"

## Core Learning Principles

### 1. Server-First Mental Model

**Think server, add client as needed.**

Server Components are the default. Only add `'use client'` when you need:
- Event handlers (`onClick`, `onChange`)
- React hooks (`useState`, `useEffect`)
- Browser APIs (`localStorage`, `window`)
- Third-party libraries that require client-side rendering

**Analogy**: Think of Server Components as the foundation of a house. Client Components are the fixtures you add where needed (light switches, thermostats). You wouldn't build the whole house as a "fixture" - start with the foundation.

**Real Example from Your Code** (`app/dashboard/page.tsx`):

```typescript
// ✅ CORRECT: Server Component by default
export default async function DashboardPage() {
  const user = await requireAuth()
  const workspaces = await getCachedWorkspaces(user.id)
  const articles = await getCachedArticles(user.id)

  return <DashboardContent {...} />
}
```

**WHY?**
- **Security**: Auth check happens on server before any UI renders
- **Performance**: Data fetched in parallel, zero client JS for this part
- **Data Access**: Direct database access without API layer overhead
- **Bundle Size**: Zero client JavaScript shipped for this component

If you made this a Client Component:
- ❌ Auth check would run on client (security concern)
- ❌ Data fetching requires separate API calls
- ❌ More JavaScript shipped to browser

---

### 2. Data Ownership

**Server = Source of Truth, Client = UI Presentation**

| Concern | Server | Client |
|---------|--------|--------|
| **Database Access** | ✅ Direct via Prisma | ❌ Never (use Server Actions) |
| **Authentication** | ✅ `cookies()`, JWT verification | ❌ Only consume results |
| **Secret Keys** | ✅ `process.env` available | ❌ Exposed to browser |
| **Caching** | ✅ `unstable_cache`, `fetch` caching | ❌ Use React Query if needed |
| **Mutations** | ✅ Server Actions | ❌ Call Server Actions |
| **UI State** | ❌ Not concerned | ✅ `useState`, `useReducer` |
| **Interactivity** | ❌ Not concerned | ✅ Event handlers |

**Real Example from Your Code**:

```typescript
// lib/server-actions.ts - Server owns data
'use server'

export async function createWorkspace(data: CreateWorkspaceInput) {
  const user = await requireAuth()  // ✅ Server checks auth
  const workspace = await prisma.workspace.create({  // ✅ Direct DB access
    data: { userId: user.id, ...data }
  })
  revalidateTag(CACHE_TAGS.WORKSPACES[0])  // ✅ Server manages cache
  return { success: true, workspace }
}
```

```typescript
// components/dashboard/DashboardContent.tsx - Client owns UI
'use client'

export function DashboardContent({ initialWorkspaces, ... }) {
  const [workspaces, setWorkspaces] = useState(initialWorkspaces)  // ✅ UI state

  const handleCreateWorkspace = async () => {
    const result = await createWorkspace(...)  // ✅ Client calls Server Action
    if (result.success) {
      setWorkspaces(prev => [result.workspace!, ...prev])  // ✅ Client updates UI
    }
  }
}
```

**WHY this separation?**
- **Security**: Database credentials never leave server
- **Simplicity**: Client doesn't need to know about Prisma, JWT, or cache invalidation
- **Performance**: Single round-trip for auth + DB operation (no API layer overhead)
- **Type Safety**: Shared TypeScript types ensure contract enforcement

---

### 3. Progressive Enhancement

**Works without JavaScript, enhanced with it.**

Server Components render HTML on the server. Client components enhance with interactivity.

**Real Example from Your Code** (`app/page.tsx`):

```typescript
export default function Home() {
  redirect('/dashboard')
}
```

This Server Component:
1. Runs on server during request
2. Issues a 307 redirect to `/dashboard`
3. Browser follows redirect
4. Dashboard page loads

**JavaScript disabled?** Still works. The redirect happens server-side.

---

### 4. Cache Invalidation Strategy

**Invalidate on mutation, revalidate on timeout.**

Your codebase uses **tag-based cache invalidation**:

```typescript
// lib/cache.ts - Centralized cache configuration
export const CACHE_TAGS = {
  WORKSPACES: ['workspaces'] as const,
  ARTICLES: ['articles'] as const,
}

export const CACHE_CONFIG = {
  WORKSPACES: { revalidate: 60 },  // 60 seconds timeout
  ARTICLES: { revalidate: 60 },
}
```

**Real Example** (`lib/queries/workspaces.ts`):

```typescript
export const getCachedWorkspaces = unstable_cache(
  async (userId: string) => {
    return prisma.workspace.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    })
  },
  ['workspaces'],  // Cache key
  {
    tags: [...CACHE_TAGS.WORKSPACES],  // Tag for invalidation
    revalidate: CACHE_CONFIG.WORKSPACES.revalidate,  // Timeout
  }
)
```

**Invalidation on Mutation** (`lib/server-actions.ts`):

```typescript
export async function createWorkspace(data: CreateWorkspaceInput) {
  const workspace = await prisma.workspace.create({ ... })

  // ✅ Invalidate all caches tagged 'workspaces'
  revalidateTag(CACHE_TAGS.WORKSPACES[0], 'max')
  revalidatePath('/dashboard', 'page')

  return { success: true, workspace }
}
```

**WHY this strategy?**

| Scenario | What Happens | Benefit |
|----------|--------------|---------|
| **User creates workspace** | `revalidateTag('workspaces')` | Next request fetches fresh data |
| **No mutations for 60s** | Cache expires naturally | Data stays fresh without explicit invalidation |
| **Multiple users** | Each gets their own cache | User A's mutation doesn't affect user B's cache |
| **Stale data requested** | Serves cached version | Faster response, fewer DB queries |

**Common Pitfall**: Forgetting to invalidate cache after mutation.

```typescript
// ❌ WRONG: Cache not invalidated
export async function createWorkspace(data: CreateWorkspaceInput) {
  return prisma.workspace.create({ ... })
  // User won't see new workspace until 60s timeout!
}

// ✅ CORRECT: Immediate invalidation
export async function createWorkspace(data: CreateWorkspaceInput) {
  const workspace = await prisma.workspace.create({ ... })
  revalidateTag(CACHE_TAGS.WORKSPACES[0], 'max')
  return { success: true, workspace }
}
```

---

### 5. Boundary Placement

**Push client boundary down. Keep server at top.**

Place the `'use client'` directive as deep in the component tree as possible.

**Real Example from Your Code**:

```
app/dashboard/page.tsx (Server Component)
  └─ components/dashboard/DashboardContent.tsx (Client Component)
       ├─ components/workspace/WorkspaceSidebar.tsx
       ├─ components/input-bar/InputBar.tsx
       └─ components/creative-zone/CreativeZone.tsx
```

**WHY this structure?**

```
┌─────────────────────────────────────────────────────┐
│ app/dashboard/page.tsx (Server)                     │
│ ✅ Fetch data from database                         │
│ ✅ Check authentication                             │
│ ✅ Apply caching                                    │
│ └─ Pass data to client boundary ──────────────────>│
└─────────────────────────────────────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────┐
│ DashboardContent.tsx (Client)                       │
│ ✅ Manage UI state (useState)                       │
│ ✅ Handle user interactions (onClick)               │
│ ✅ Call Server Actions                              │
│ ✅ Optimistic updates                               │
└─────────────────────────────────────────────────────┘
```

**If you moved the client boundary up**:

```typescript
// ❌ WRONG: Client Component at page level
'use client'

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState([])

  useEffect(() => {
    // ❌ Fetching data in useEffect
    fetch('/api/workspaces').then(r => r.json()).then(setWorkspaces)
  }, [])

  // ❌ No server-side data fetching
  // ❌ No caching
  // ❌ Slower initial load
  // ❌ Waterfall: page → fetch data → render
}
```

**Test**: Ask yourself, "Could this component work on the server?" If yes, keep it as a Server Component.

---

## Code Review Framework

When reviewing code, check these aspects:

### 1. Server vs Client

**Checklist**:
- [ ] Is this a Server Component by default?
- [ ] If it has `'use client'`, is it justified?
  - Event handlers? → Need client
  - React hooks? → Need client
  - Browser APIs? → Need client
  - Interactivity? → Need client
- [ ] Can the client boundary move deeper?

**Real Example Review**:

```typescript
// components/workspace/WorkspaceSidebar.tsx
'use client'

export function WorkspaceSidebar({
  workspaces,
  currentWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  // ... many props
}) {
  // useState, onClick handlers → ✅ Needs 'use client'
}
```

**Verdict**: ✅ Correct - requires interactivity (selection, creation)

---

### 2. Data Fetching

**Checklist**:
- [ ] Is data fetched in Server Component?
- [ ] Is caching applied (`unstable_cache` or `fetch` with `next` options)?
- [ ] Are tags configured for cache invalidation?
- [ ] Is data fetched close to where it's used?

**Real Example Review**:

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const user = await requireAuth()  // ✅ Auth check
  const workspaces = await getCachedWorkspaces(user.id)  // ✅ Cached
  const articles = await await getCachedArticles(user.id)  // ✅ Cached

  return <DashboardContent {...} />  // ✅ Pass data to client
}
```

**Verdict**: ✅ Correct - data fetched in Server Component with caching

---

### 3. Authentication

**Checklist**:
- [ ] Does the page require auth? → Use `requireAuth()` in Server Component
- [ ] Are Server Actions protected? → Call `requireAuth()` inside
- [ ] Are ownership checks performed? → Verify `userId` matches

**Real Example Review**:

```typescript
// lib/server-actions.ts
export async function createWorkspace(data: CreateWorkspaceInput) {
  const user = await requireAuth()  // ✅ Auth check

  const workspace = await prisma.workspace.create({
    data: {
      userId: user.id,  // ✅ Ownership enforced
      ...data
    }
  })
}
```

**Verdict**: ✅ Correct - auth check and ownership enforcement

---

### 4. Cache Invalidation

**Checklist**:
- [ ] Do mutations call `revalidateTag()` or `revalidatePath()`?
- [ ] Are tags consistent between cache and invalidation?
- [ ] Is the invalidation specific enough? (Avoid `revalidatePath('/')`)

**Real Example Review**:

```typescript
// lib/server-actions.ts
export async function createWorkspace(data: CreateWorkspaceInput) {
  const workspace = await prisma.workspace.create({ ... })

  revalidateTag(CACHE_TAGS.WORKSPACES[0], 'max')  // ✅ Tag-based
  revalidatePath('/dashboard', 'page')  // ✅ Path-based

  return { success: true, workspace }
}
```

**Verdict**: ✅ Correct - both tag and path invalidation

---

## Decision Guides

### API Routes vs Server Actions

**Decision Framework**:

| Use API Routes (`route.ts`) When | Use Server Actions (`'use server'`) When |
|----------------------------------|------------------------------------------|
| External clients need to call it | Only your Next.js app uses it |
| Need REST/GraphQL API | Need direct database mutations |
| Public API endpoints | Authenticated user actions |
| Webhook handlers | Form submissions from your app |
| CORS required | Same-origin only |

**Real Example from Your Code**:

```typescript
// ✅ Server Action - Internal use
'use server'

export async function createWorkspace(data: CreateWorkspaceInput) {
  // Used only by DashboardContent component
  // No external clients need this
}
```

```typescript
// Example: When to use API Route
// app/api/ai/generate/route.ts - External API
export async function POST(request: NextRequest) {
  // Could be called by external services
  // Needs to be a REST endpoint
}
```

---

### When to Use `unstable_cache` vs Direct Prisma

**Decision Framework**:

| Use `unstable_cache` When | Use Direct Prisma When |
|---------------------------|------------------------|
| Data is read frequently | Data is read once |
| Reused across requests | Single-use data |
| Benefits from caching | Always needs fresh data |
| No per-request customization | Requires per-request logic |

**Real Example from Your Code**:

```typescript
// ✅ Cached - Reused across requests
export const getCachedWorkspaces = unstable_cache(
  async (userId: string) => {
    return prisma.workspace.findMany({ ... })
  },
  ['workspaces'],
  { tags: [...CACHE_TAGS.WORKSPACES], revalidate: 60 }
)
```

```typescript
// ✅ Not cached - Single use, ownership check
export async function getWorkspaceWithAuth(workspaceId: string, userId: string) {
  return prisma.workspace.findFirst({
    where: { id: workspaceId, userId, isDeleted: false }
  })
}
```

---

### `revalidateTag` vs `revalidatePath`

**Decision Framework**:

| Use `revalidateTag` When | Use `revalidatePath` When |
|--------------------------|---------------------------|
| Multiple paths use same data | Only one path displays data |
| Data identified by tag | Data tied to specific route |
| Fine-grained invalidation | Coarse-grained invalidation |
| Tags configured on cache | Simpler mental model |

**Real Example from Your Code**:

```typescript
// ✅ revalidateTag - Multiple places display workspaces
revalidateTag(CACHE_TAGS.WORKSPACES[0], 'max')
// Invalidates: /dashboard, /workspace/[id], any page using workspaces

// ✅ revalidatePath - Only dashboard affected
revalidatePath('/dashboard', 'page')
// Invalidates: Only /dashboard page
```

---

## Common Pitfalls

### Pitfall 1: Fetching in Client Components

```typescript
// ❌ WRONG
'use client'

export function WorkspacesList() {
  const [workspaces, setWorkspaces] = useState([])

  useEffect(() => {
    fetch('/api/workspaces').then(r => r.json()).then(setWorkspaces)
  }, [])

  return <div>{workspaces.map(...)}</div>
}

// ✅ CORRECT
// app/workspaces/page.tsx (Server Component)
export default async function WorkspacesPage() {
  const workspaces = await getCachedWorkspaces(userId)
  return <WorkspacesList workspaces={workspaces} />
}

// components/WorkspacesList.tsx (Client Component)
'use client'

export function WorkspacesList({ workspaces }) {
  // Just render, no fetching
  return <div>{workspaces.map(...)}</div>
}
```

**Detection**: Look for `useEffect` + `fetch` in Client Components.
**Fix**: Move data fetching to Server Component, pass data as props.

---

### Pitfall 2: Forgetting Cache Invalidation

```typescript
// ❌ WRONG
export async function createWorkspace(data: CreateWorkspaceInput) {
  const workspace = await prisma.workspace.create({ ... })
  return { success: true, workspace }
  // Cache not invalidated! Users won't see new workspace.
}

// ✅ CORRECT
export async function createWorkspace(data: CreateWorkspaceInput) {
  const workspace = await prisma.workspace.create({ ... })
  revalidateTag(CACHE_TAGS.WORKSPACES[0], 'max')
  return { success: true, workspace }
}
```

**Detection**: Mutation in Server Action without `revalidateTag` or `revalidatePath`.
**Fix**: Add appropriate cache invalidation after mutation.

---

### Pitfall 3: Client Boundary Too High

```typescript
// ❌ WRONG: Client Component at page level
'use client'

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState([])
  // ... lots of server data fetching in useEffect
}

// ✅ CORRECT: Server Component at page level
export default async function DashboardPage() {
  const workspaces = await getCachedWorkspaces(user.id)
  return <DashboardContent initialWorkspaces={workspaces} />
}
```

**Detection**: Page component has `'use client'`.
**Fix**: Keep page as Server Component, create client child component.

---

### Pitfall 4: Missing Ownership Checks

```typescript
// ❌ WRONG: No ownership check
export async function updateWorkspace(workspaceId: string, data: UpdateWorkspaceInput) {
  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data,
  })
  // Anyone can update any workspace!
}

// ✅ CORRECT: Verify ownership
export async function updateWorkspace(workspaceId: string, data: UpdateWorkspaceInput) {
  const user = await requireAuth()

  const existing = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId: user.id, isDeleted: false }
  })

  if (!existing) {
    return { success: false, error: 'Workspace not found' }
  }

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data,
  })
}
```

**Detection**: Mutation uses `id` from user input without verifying ownership.
**Fix**: Check that resource belongs to authenticated user.

---

## Learning Paths

### Beginner: Understanding Server vs Client

1. Read `app/dashboard/page.tsx` - Server Component with data fetching
2. Read `components/dashboard/DashboardContent.tsx` - Client Component with state
3. Identify the boundary: Where does `'use client'` appear?
4. Ask yourself: Why can't DashboardContent be a Server Component?
   - Answer: It uses `useState`, `useEffect`, event handlers

### Intermediate: Caching Strategy

1. Read `lib/cache.ts` - Cache tag configuration
2. Read `lib/queries/workspaces.ts` - `unstable_cache` implementation
3. Read `lib/server-actions.ts` - Cache invalidation on mutation
4. Trace the flow:
   - Page calls `getCachedWorkspaces()`
   - Cache miss → DB query → cache result
   - User creates workspace → `revalidateTag('workspaces')`
   - Next request → cache hit (fresh data)

### Advanced: Architecture Decisions

1. **Analyze auth flow**: `lib/auth.ts` → Server Actions → Page components
   - Why is `requireAuth()` called in Server Components?
   - How does JWT verification work server-side?

2. **Analyze data flow**: Database → Server Component → Client Component
   - Where is the data transformed?
   - How is type safety maintained across the boundary?

3. **Analyze error handling**: Try-catch in Server Actions → Client-side error display
   - How are errors propagated from server to client?
   - What happens when `requireAuth()` throws?

---

## Quick Reference: Your Codebase

| File | Role | Key Pattern |
|------|------|-------------|
| `app/dashboard/page.tsx` | Server Component | Data fetching + auth check |
| `app/page.tsx` | Server Component | Server-side redirect |
| `components/dashboard/DashboardContent.tsx` | Client Component | State + Server Actions |
| `lib/server-actions.ts` | Server Actions | Mutations with cache invalidation |
| `lib/cache.ts` | Cache config | Tag-based strategy |
| `lib/queries/workspaces.ts` | Data access | `unstable_cache` wrapper |
| `lib/auth.ts` | Authentication | JWT + cookies |
| `lib/queries/articles.ts` | Data access | Cached queries with auth |

---

## Teaching Methodology

This mentor differs from documentation through:

1. **Real Examples**: Every pattern is demonstrated with your actual code
2. **WHY Explanations**: Not just "what to do" but "why it matters"
3. **Trade-offs**: Shows wrong vs right approaches with consequences
4. **Decision Frameworks**: Guides you through architectural choices
5. **Code Reviews**: Structured checklist for reviewing your own code

**Approach**:
- Ask questions to understand your mental model
- Provide analogies for complex concepts
- Show progressive complexity (beginner → advanced)
- Reference your actual codebase for all examples

---

## Verification Scenarios

Test this skill with:

1. **Review Request**: "Review my dashboard page architecture"
   - Should analyze `app/dashboard/page.tsx`
   - Validate Server Component usage
   - Explain benefits of current approach

2. **Learning Request**: "Why do we use Server Components here?"
   - Should explain security, performance, data access benefits
   - Show trade-offs vs Client Components

3. **Decision Help**: "Should I use API route or Server Action?"
   - Should provide decision framework
   - Recommend based on requirements

4. **Code Review**: "Analyze my caching strategy"
   - Should review `lib/cache.ts` and `lib/queries/`
   - Validate approach, suggest improvements if any

---

**Remember**: The goal is understanding, not memorization. Ask "why?" until the architecture makes sense intuitively.
