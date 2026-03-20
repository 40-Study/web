# Phase 5: Testing & Polish

## Overview

- **Priority**: P2 (Important)
- **Status**: Pending
- **Effort**: 4h

Write unit tests cho services, hooks, stores. Final code review và cleanup.

## Testing Strategy

```
Priority Order:
1. Services (auth, course, class) - Business logic
2. Hooks (use-auth, use-courses, use-teacher) - Integration with services
3. Utilities (api-client, errors) - Core infrastructure
4. Stores (auth.store) - State management
```

## Test Files to Create

### 1. Auth Service Tests

`src/services/__tests__/auth.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '../auth.service'
import { api } from '@/lib/api-client'

vi.mock('@/lib/api-client')

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should call API with credentials', async () => {
      const mockResponse = {
        data: {
          message: 'success',
          data: {
            session_token: 'token123',
            system_roles: [{ id: '1', name: 'student' }],
            user: { id: '1', email: 'test@example.com', name: 'Test' },
          },
        },
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.data.session_token).toBe('token123')
    })

    it('should throw on invalid credentials', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Invalid credentials'))

      await expect(
        authService.login({ email: 'wrong@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('getMe', () => {
    it('should return user data', async () => {
      const mockResponse = {
        data: {
          message: 'success',
          data: {
            user: { id: '1', email: 'test@example.com', name: 'Test' },
            permissions: ['read:courses'],
          },
        },
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await authService.getMe()

      expect(api.get).toHaveBeenCalledWith('/auth/me')
      expect(result.user.email).toBe('test@example.com')
    })
  })
})
```

### 2. Course Service Tests

`src/services/__tests__/course.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { courseService } from '../course.service'
import { apiClient } from '@/lib/api-client'

vi.mock('@/lib/api-client')

describe('courseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should fetch courses with filters', async () => {
      const mockCourses = [{ id: '1', title: 'React Basics' }]
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockCourses })

      const result = await courseService.list({ category: 'programming' })

      expect(apiClient.get).toHaveBeenCalledWith('/courses', {
        params: { category: 'programming' },
      })
    })
  })

  describe('enroll', () => {
    it('should enroll user in course', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ message: 'success' })

      await courseService.enroll('course123')

      expect(apiClient.post).toHaveBeenCalledWith('/courses/course123/enroll', {})
    })
  })
})
```

### 3. Auth Hook Tests

`src/hooks/queries/__tests__/use-auth.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLogin, useMe } from '../use-auth'
import { authService } from '@/services/auth.service'
import { Providers } from '@/test/test-utils'

vi.mock('@/services/auth.service')

describe('useLogin', () => {
  it('should handle successful login', async () => {
    const mockResponse = {
      data: {
        session_token: 'token123',
        system_roles: [{ id: '1', name: 'student' }],
        user: { id: '1', email: 'test@example.com', name: 'Test' },
      },
    }
    vi.mocked(authService.login).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useLogin(), { wrapper: Providers })

    result.current.mutate({
      email: 'test@example.com',
      password: 'password123',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('should handle login error', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('Invalid'))

    const { result } = renderHook(() => useLogin(), { wrapper: Providers })

    result.current.mutate({
      email: 'wrong@example.com',
      password: 'wrong',
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
```

### 4. Auth Store Tests

`src/stores/__tests__/auth.store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../auth.store'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('should login user', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test' }
    const roles = [{ id: '1', name: 'student' }]

    useAuthStore.getState().login(user, roles)

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('should logout user', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test' }
    useAuthStore.getState().login(user, [])

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('should set active role', () => {
    useAuthStore.getState().setActiveRole('teacher')

    expect(useAuthStore.getState().activeRole).toBe('teacher')
  })
})
```

### 5. API Client Tests

`src/lib/__tests__/api-client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { api } from '../api-client'

vi.mock('axios')

describe('api-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should attach auth token to requests', async () => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { token: 'test-token' }
    }))

    // Test interceptor logic
    const config = { headers: {} }
    const requestInterceptor = api.interceptors.request.handlers[0].fulfilled
    const result = requestInterceptor(config)

    expect(result.headers.Authorization).toBe('Bearer test-token')
  })
})
```

## Test Coverage Targets

| Module | Target | Priority |
|--------|--------|----------|
| services/auth.service.ts | 90% | P1 |
| services/course.service.ts | 80% | P1 |
| services/class.service.ts | 80% | P1 |
| hooks/queries/use-auth.ts | 80% | P1 |
| hooks/use-courses.ts | 70% | P2 |
| stores/auth.store.ts | 90% | P2 |
| lib/api-client.ts | 70% | P2 |

## Code Cleanup Checklist

### Remove Dead Code
- [ ] Remove unused useLogoutDevice() or mark deprecated
- [ ] Remove mock data files if no longer needed
- [ ] Remove commented-out code

### Type Safety
- [ ] Fix all `any` types
- [ ] Add proper error typing (catch blocks)
- [ ] Validate API responses match types

### Consistency
- [ ] Consistent error messages (Vietnamese)
- [ ] Consistent loading state patterns
- [ ] Consistent naming (camelCase vs SCREAMING_SNAKE)

### Documentation
- [ ] Add JSDoc to public service methods
- [ ] Document complex hooks
- [ ] Update README if needed

## Files to Create

```
src/
├── services/__tests__/
│   ├── auth.service.test.ts
│   ├── course.service.test.ts
│   └── class.service.test.ts
├── hooks/queries/__tests__/
│   ├── use-auth.test.tsx
│   └── use-courses.test.tsx
├── stores/__tests__/
│   └── auth.store.test.ts
└── lib/__tests__/
    └── api-client.test.ts
```

## Todo List

- [ ] Write auth.service tests
- [ ] Write course.service tests
- [ ] Write class.service tests
- [ ] Write use-auth hook tests
- [ ] Write use-courses hook tests
- [ ] Write auth.store tests
- [ ] Write api-client tests
- [ ] Run coverage report
- [ ] Fix failing tests
- [ ] Remove dead code
- [ ] Fix type issues
- [ ] Final code review
- [ ] Run full test suite

## Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/services/__tests__/auth.service.test.ts

# Run tests in watch mode
npm test -- --watch
```

## Success Criteria

- All tests pass
- Coverage ≥80% on services/hooks
- No TypeScript errors
- No ESLint errors
- Clean git history (no fixup commits)
- Code review approved

## Final Verification

Before marking plan complete:

1. `npm run build` - No build errors
2. `npm test` - All tests pass
3. `npm run lint` - No lint errors
4. Manual test critical flows:
   - [ ] Login → Select Role → Select Org → Dashboard
   - [ ] Browse courses → Enroll → Watch lesson
   - [ ] Teacher dashboard loads data
