# Phase 3: Integration Implementation

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: 8h

Implement missing services, update existing ones, add React Query hooks.

---

## Implementation Order

### Priority 1: Commerce Flow (2h)

#### 3.1 Create `cart.service.ts`
**File**: `src/services/cart.service.ts`

```typescript
// Types
interface CartItem {
  id: string;
  course_id: string;
  course: { id: string; title: string; price: number; thumbnail?: string };
  added_at: string;
}

interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

// Endpoints
- GET /cart → getCart(): Cart
- POST /cart { course_id } → addToCart(courseId): CartItem
- DELETE /cart { course_id } → removeFromCart(courseId): void
- DELETE /cart/clear → clearCart(): void
- GET /cart/check/:courseId → isInCart(courseId): boolean
```

#### 3.2 Create `order.service.ts`
**File**: `src/services/order.service.ts`

```typescript
// Types
interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  discount: number;
  final_total: number;
  voucher_id?: string;
  status: "pending" | "paid" | "cancelled" | "refunded";
  payment_method?: string;
  created_at: string;
}

interface CreateOrderDTO {
  course_ids: string[];
  voucher_code?: string;
}

// Endpoints
- POST /orders → createOrder(dto): Order
- GET /orders/me → getMyOrders(): Order[]
- GET /orders/:id → getOrder(id): Order
- POST /orders/:id/cancel → cancelOrder(id): void
- POST /orders/:id/payment-intent → createPaymentIntent(id): { client_secret: string }
- GET /orders/:id/payment-status → getPaymentStatus(id): { status: string }
- POST /orders/:id/check-payment → checkPayment(id): { paid: boolean }
```

#### 3.3 Update `voucher.service.ts`
**Replace mock with real API calls**

```typescript
// Remove MOCK_VOUCHERS array
// Update methods:
- getPublicVouchers() → GET /vouchers/public
- getVoucherByCode(code) → GET /vouchers/code/:code
- getMyVouchers() → GET /vouchers/me
- saveVoucher(id) → POST /vouchers/:id/save
- unsaveVoucher(id) → DELETE /vouchers/:id/save
// Admin methods:
- createVoucher(dto) → POST /vouchers
- getAllVouchers() → GET /vouchers
- updateVoucher(id, dto) → PUT /vouchers/:id
- deleteVoucher(id) → DELETE /vouchers/:id
- restoreVoucher(id) → POST /vouchers/:id/restore
- activateVoucher(id) → POST /vouchers/:id/activate
- deactivateVoucher(id) → POST /vouchers/:id/deactivate
- getVoucherStats(id) → GET /vouchers/:id/stats
```

#### 3.4 Create hooks: `use-cart.ts`, `use-orders.ts`
**Files**: `src/hooks/queries/use-cart.ts`, `src/hooks/queries/use-orders.ts`

---

### Priority 2: Course Content Management (2.5h)

#### 3.5 Update `course.service.ts`
**Add CRUD operations**

```typescript
// Add:
- createCourse(dto) → POST /courses
- updateCourse(id, dto) → PUT /courses/:id
- deleteCourse(id) → DELETE /courses/:id
```

#### 3.6 Create `section.service.ts`
**File**: `src/services/section.service.ts`

```typescript
// Types
interface Section {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  position: number;
  lessons: Lesson[];
}

// Endpoints (all require courseId context)
- POST /courses/:courseId/sections → create
- GET /courses/:courseId/sections → getAll
- PUT /courses/:courseId/sections/reorder → reorder
- PUT /courses/:courseId/sections/:id → update
- DELETE /courses/:courseId/sections/:id → delete
```

#### 3.7 Create `lesson.service.ts`
**File**: `src/services/lesson.service.ts`

```typescript
// Types
interface Lesson {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  type: "video" | "article" | "quiz";
  duration?: number;
  position: number;
  is_preview: boolean;
}

// Endpoints (nested under section)
- POST .../sections/:sectionId/lessons → create
- GET .../sections/:sectionId/lessons → getAll
- PUT .../sections/:sectionId/lessons/reorder → reorder
- PUT .../sections/:sectionId/lessons/:id → update
- DELETE .../sections/:sectionId/lessons/:id → delete
```

#### 3.8 Create `lesson-content.service.ts`
**File**: `src/services/lesson-content.service.ts`

```typescript
// Types
interface LessonVideo {
  id: string;
  lesson_id: string;
  video_upload_id: string;
  hls_url?: string;
  duration: number;
}

interface LessonArticle {
  id: string;
  lesson_id: string;
  content: string; // HTML/Markdown
}

interface LessonAttachment {
  id: string;
  lesson_id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

// Endpoints
- GET /lessons/:lessonId/video → getVideo
- POST /lessons/:lessonId/video → createVideo
- PUT /lessons/:lessonId/video → updateVideo
- DELETE /lessons/:lessonId/video → deleteVideo
- GET /lessons/:lessonId/article → getArticle
- POST /lessons/:lessonId/article → createArticle
- PUT /lessons/:lessonId/article → updateArticle
- DELETE /lessons/:lessonId/article → deleteArticle
- GET /lessons/:lessonId/attachments → getAttachments
- POST /lessons/:lessonId/attachments → createAttachment
- DELETE /lessons/:lessonId/attachments/:id → deleteAttachment
```

#### 3.9 Create `category.service.ts`
**File**: `src/services/category.service.ts`

```typescript
// Move getCategories from course.service.ts
// Add CRUD + tags
- GET /categories → getAll
- GET /categories/:id → getById
- POST /categories → create
- PUT /categories/:id → update
- DELETE /categories/:id → delete
- GET /tags → getAllTags
- POST /tags → createTag
- DELETE /tags/:id → deleteTag
```

#### 3.10 Create hooks: `use-courses.ts`, `use-sections.ts`, `use-lessons.ts`

---

### Priority 3: Enrollment & Progress (1h)

#### 3.11 Create `enrollment.service.ts`
**File**: `src/services/enrollment.service.ts`

```typescript
// Extract from course.service.ts and expand
- POST /courses/:courseId/enroll → enroll
- DELETE /courses/:courseId/enroll → unenroll
- GET /enrollments → getMyEnrollments
- GET /enrollments/:id → getEnrollmentDetail
- PUT /lessons/:lessonId/progress → updateProgress (fix method)
```

#### 3.12 Create hook: `use-enrollments.ts`

---

### Priority 4: Video & Upload (1h)

#### 3.13 Rewrite `video.service.ts`
**Match actual backend API structure**

```typescript
// Fix endpoints:
- POST /videos/upload/init → initUpload
- POST /videos/upload/presigned-urls → getPresignedUrls (POST not GET!)
- POST /videos/upload/chunk-complete → completeChunk
- POST /videos/upload/complete → completeUpload
- GET /videos/upload/:id/status → getStatus
- GET /videos/upload/:id/resume → getResumeInfo
- GET /videos/upload/incomplete → getIncomplete
- DELETE /videos/upload/:id → abort
- GET /videos/processing/queue → getProcessingQueue
// HLS:
- GET /hls/:id/info → getVideoInfo
- GET /hls/:id/master.m3u8 → getMasterPlaylist
```

#### 3.14 Create `upload.service.ts`
**File**: `src/services/upload.service.ts`

```typescript
// Simple file upload (images, etc)
- POST /upload → uploadImage(file): { url: string }
- POST /upload/any → upload(file): { url: string }
- DELETE /upload?url=... → deleteFile(url): void
```

---

### Priority 5: Teacher & Analytics (0.5h)

#### 3.15 Create `teacher.service.ts`
**File**: `src/services/teacher.service.ts`

```typescript
// Teachers
- GET /teachers → getAll
- GET /teachers/:id → getById
- DELETE /teachers/:id → delete
// Teacher Profiles
- POST /teacher-profiles → createProfile
- GET /teacher-profiles → getAllProfiles
- GET /teacher-profiles/:id → getProfile
- PUT /teacher-profiles/:id → updateProfile
- DELETE /teacher-profiles/:id → deleteProfile
```

#### 3.16 Create `analytics.service.ts`
**File**: `src/services/analytics.service.ts`

```typescript
- GET /analytics/livestream/:sessionId → getLivestreamAnalytics
- GET /analytics/assignment/:assignmentId → getAssignmentAnalytics
- GET /analytics/participants/:sessionId → getParticipantAnalytics
```

---

### Priority 6: Cleanup & Hooks (1h)

#### 3.17 Remove/Fix `schedule.service.ts`
- Option A: Remove file (use `classService.getSchedules`)
- Option B: Rewrite as wrapper around class schedules

#### 3.18 Update `livestream.service.ts`
Add missing endpoints:
```typescript
- POST /livestream/:id/lock-whiteboard
- POST /livestream/:id/unlock-whiteboard
- POST /livestream/:id/screenshare/start
- POST /livestream/:id/screenshare/stop
```

#### 3.19 Create remaining hooks
- `use-organizations.ts`
- `use-roles.ts`
- `use-video.ts`
- `use-categories.ts`

---

## Implementation Checklist

### New Services to Create
- [ ] `src/services/cart.service.ts`
- [ ] `src/services/order.service.ts`
- [ ] `src/services/section.service.ts`
- [ ] `src/services/lesson.service.ts`
- [ ] `src/services/lesson-content.service.ts`
- [ ] `src/services/category.service.ts`
- [ ] `src/services/enrollment.service.ts`
- [ ] `src/services/upload.service.ts`
- [ ] `src/services/teacher.service.ts`
- [ ] `src/services/analytics.service.ts`

### Services to Update
- [ ] `src/services/voucher.service.ts` - Replace mock
- [ ] `src/services/course.service.ts` - Add CRUD
- [ ] `src/services/video.service.ts` - Rewrite
- [ ] `src/services/livestream.service.ts` - Add missing
- [ ] `src/services/auth.service.ts` - Add 2 endpoints

### Services to Remove/Fix
- [ ] `src/services/schedule.service.ts` - Wrong endpoint

### New Hooks to Create
- [ ] `src/hooks/queries/use-cart.ts`
- [ ] `src/hooks/queries/use-orders.ts`
- [ ] `src/hooks/queries/use-courses.ts`
- [ ] `src/hooks/queries/use-sections.ts`
- [ ] `src/hooks/queries/use-lessons.ts`
- [ ] `src/hooks/queries/use-enrollments.ts`
- [ ] `src/hooks/queries/use-organizations.ts`
- [ ] `src/hooks/queries/use-roles.ts`
- [ ] `src/hooks/queries/use-categories.ts`

### Hooks to Update
- [ ] `src/hooks/queries/use-classes.ts` - Add mutations
- [ ] `src/hooks/queries/use-livestream.ts` - Add mutations
- [ ] `src/hooks/queries/use-voucher.ts` - Real API

---

## Success Criteria
- All services compile without TypeScript errors
- API paths match backend router definitions
- Response types match backend DTOs
- No mock data in production services
- React Query hooks follow established patterns
- Error handling with toast notifications
