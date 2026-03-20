# Phase 1: Setup Vitest

## Overview

- **Priority**: P1 (Must do first)
- **Status**: Pending
- **Effort**: 4h

Setup Vitest testing framework với React Testing Library cho Next.js 14 project.

## Requirements

### Functional
- Vitest chạy được với Next.js 14
- Support React Testing Library
- MSW cho API mocking
- Coverage reporting

### Non-functional
- Fast test execution (<5s for unit tests)
- Watch mode hoạt động tốt
- IDE integration (VSCode)

## Files to Create

```
src/
├── test/
│   ├── setup.ts              # Global test setup
│   ├── test-utils.tsx        # Custom render, providers
│   └── mocks/
│       ├── handlers.ts       # MSW handlers
│       └── server.ts         # MSW server setup
vitest.config.ts              # Vitest configuration
```

## Files to Modify

```
package.json                  # Add test scripts, dependencies
tsconfig.json                 # Add test paths if needed
```

## Implementation Steps

### 1. Install Dependencies

```bash
npm install -D vitest @vitest/coverage-v8 @vitest/ui \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  msw jsdom
```

### 2. Create vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/services/**', 'src/hooks/**', 'src/lib/**', 'src/stores/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 3. Create Test Setup (src/test/setup.ts)

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
```

### 4. Create Test Utils (src/test/test-utils.tsx)

```typescript
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: Providers, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### 5. Create MSW Setup (src/test/mocks/server.ts)

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### 6. Create Basic Handlers (src/test/mocks/handlers.ts)

```typescript
import { http, HttpResponse } from 'msw'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const handlers = [
  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json({
      message: 'success',
      data: {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        permissions: ['read:courses', 'write:courses'],
      },
    })
  }),
  // Add more handlers as needed
]
```

### 7. Update package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 8. Write Baseline Test

```typescript
// src/test/sanity.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from './test-utils'

describe('Sanity Check', () => {
  it('testing framework works', () => {
    expect(1 + 1).toBe(2)
  })

  it('react testing library works', () => {
    render(<div>Hello World</div>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
```

## Todo List

- [ ] Install Vitest + testing-library
- [ ] Create vitest.config.ts
- [ ] Create src/test/setup.ts
- [ ] Create src/test/test-utils.tsx
- [ ] Setup MSW for API mocking
- [ ] Create baseline handlers
- [ ] Update package.json scripts
- [ ] Write sanity test
- [ ] Run `npm test` verify working

## Success Criteria

- `npm test` runs without errors
- Watch mode works
- Coverage report generates
- MSW intercepts API calls correctly

## Next Steps

After this phase: [Phase 2 - Fix Auth Module](./phase-02-fix-auth-module.md)
