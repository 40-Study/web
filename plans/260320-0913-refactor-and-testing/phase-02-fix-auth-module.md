# Phase 2: Fix Auth Module

## Overview

- **Priority**: P1 (Critical)
- **Status**: Pending
- **Effort**: 8h
- **Issues**: 19

Fix race conditions, error handling, và state management trong auth module.

## Context

- [Brainstorm Report - Auth Section](../reports/brainstorm-260320-0913-refactor-and-testing.md#auth-module-19-issues)

## Critical Issues (Fix First)

### 1. Race Condition in useLogin() - use-auth.ts:78-106

**Problem**: `selectProfile` called without proper await, navigation happens before mutation completes.

**Fix**:
```typescript
// Before (broken)
onSuccess: async (response) => {
  // ... setup
  if (system_roles.length === 1) {
    try {
      const selectResponse = await authService.selectProfile({...})
      setOrganizations(selectResponse.data.organizations)
      router.push("/login/organization") // May run before selectProfile completes
    } catch {
      toast.error("Đăng nhập thất bại")
    }
  }
}

// After (fixed)
onSuccess: async (response) => {
  const { session_token, system_roles, user } = response.data
  login(user, system_roles)
  setSessionToken(session_token)
  setSystemRoles(system_roles)

  if (system_roles.length > 1) {
    router.push("/login/role")
    return
  }

  if (system_roles.length === 1) {
    try {
      const selectResponse = await authService.selectProfile({
        session_token,
        system_role_id: system_roles[0].id,
      })
      setOrganizations(selectResponse.data.organizations)
      // Only navigate after everything succeeds
      router.push("/login/organization")
    } catch (error) {
      console.error('Select profile failed:', error)
      toast.error("Đăng nhập thất bại", {
        description: "Không thể chọn vai trò. Vui lòng thử lại."
      })
      // Clear partial state
      logout()
    }
  }
}
```

### 2. Missing onError in useSelectProfile() - use-auth.ts:141-156

**Fix**: Add error handling
```typescript
return useMutation({
  mutationFn: async (roleId: string) => {
    if (!sessionToken) throw new Error("No session token")
    return authService.selectProfile({
      session_token: sessionToken,
      system_role_id: roleId,
    })
  },
  onSuccess: (response) => {
    setOrganizations(response.data.organizations)
  },
  onError: (error) => {
    console.error('Select profile error:', error)
    toast.error("Chọn vai trò thất bại", {
      description: "Vui lòng thử lại hoặc đăng nhập lại"
    })
  },
})
```

### 3. Missing onError in useSelectOrg() - use-auth.ts:159-177

**Fix**: Add try-catch and error handling
```typescript
return useMutation({
  mutationFn: authService.selectOrg,
  onSuccess: async (response) => {
    try {
      const accessToken = response.data.access_token
      setToken(accessToken)
      setSessionToken(null)
      const me = await authService.getMe()
      setPermissions(me.permissions as Permission[])
      qc.invalidateQueries({ queryKey: authKeys.all })
      router.push("/dashboard")
    } catch (error) {
      console.error('Failed to get user info:', error)
      toast.error("Lỗi lấy thông tin người dùng")
    }
  },
  onError: (error) => {
    console.error('Select org error:', error)
    toast.error("Chọn tổ chức thất bại")
  },
})
```

### 4. API Contract Mismatch - auth.service.ts:169-170

**Problem**: `getMe()` unwraps incorrectly.

**Fix**:
```typescript
// Before
getMe: () =>
  api.get<{ message: string; data: { user: LoginResponse["data"]["user"]; permissions: string[] } }>("/auth/me")
    .then((r) => r.data.data), // Wrong - unwraps twice

// After
getMe: () =>
  api.get<{ message: string; data: { user: LoginResponse["data"]["user"]; permissions: string[] } }>("/auth/me")
    .then((r) => r.data), // Correct - api returns response, then access .data
```

## High Priority Issues

### 5. Type Mismatch in login/organization/page.tsx:25

**Fix**: Pass full Organization object
```typescript
// Before
setActiveOrg({ id: org.id, name: org.name })

// After
setActiveOrg(org) // Pass full org with code, logo if available
```

### 6. Null Check in login/role/page.tsx:26

**Fix**: Safe initialization
```typescript
// Before
setSelectedRole(systemRoles[0] || null)

// After
setSelectedRole(systemRoles.length > 0 ? systemRoles[0] : null)
```

### 7. Mock Children Data - login/children/page.tsx:10

**Fix**: Use useChildren() hook
```typescript
// Before
import { MOCK_CHILDREN } from "@/lib/mock-data"
// ... uses MOCK_CHILDREN directly

// After
import { useChildren } from "@/hooks/queries/use-auth"

export default function ChildrenPage() {
  const { data: childrenData, isLoading, error } = useChildren()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorState message="Không thể tải danh sách" />

  const children = childrenData?.children ?? []
  // ... rest of component
}
```

## Medium Priority Issues

### 8-12. Error Typing & Handling

**Fix**: Type error parameters properly
```typescript
// Before
} catch {
  toast.error("Đăng nhập thất bại")
}

// After
} catch (error: unknown) {
  console.error('Login error:', error)
  const message = error instanceof Error ? error.message : 'Unknown error'
  toast.error("Đăng nhập thất bại", { description: message })
}
```

### 13. Unused useLogoutDevice()

**Fix**: Either implement or remove with TODO comment
```typescript
/** @deprecated Backend does not support per-device logout */
export function useLogoutDevice() {
  return useMutation({
    mutationFn: async (_deviceId: string) => {
      // TODO: Implement when backend supports
      throw new Error("Per-device logout not supported by backend")
    },
    onError: () => {
      toast.info("Tính năng đăng xuất từng thiết bị chưa được hỗ trợ")
    },
  })
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/queries/use-auth.ts` | Fix race conditions, add error handlers |
| `src/services/auth.service.ts` | Fix getMe() return |
| `src/stores/auth.store.ts` | Review persistence settings |
| `src/lib/api-client.ts` | Improve error handling |
| `src/app/(auth)/login/role/page.tsx` | Fix null check |
| `src/app/(auth)/login/organization/page.tsx` | Fix type mismatch |
| `src/app/(auth)/login/children/page.tsx` | Replace mock with hook |

## Todo List

- [ ] Fix race condition in useLogin()
- [ ] Add onError to useSelectProfile()
- [ ] Add onError to useSelectOrg()
- [ ] Fix getMe() API contract
- [ ] Fix setActiveOrg type mismatch
- [ ] Fix null check in role page
- [ ] Replace MOCK_CHILDREN with useChildren()
- [ ] Add proper error typing throughout
- [ ] Remove/deprecate useLogoutDevice()
- [ ] Write tests for auth hooks

## Success Criteria

- Login flow works without race conditions
- All mutations have error handlers
- API contracts match service definitions
- No TypeScript errors in auth module
- Tests pass for critical auth flows

## Next Steps

After this phase: [Phase 3 - Fix Course/Lesson](./phase-03-fix-course-lesson.md)
