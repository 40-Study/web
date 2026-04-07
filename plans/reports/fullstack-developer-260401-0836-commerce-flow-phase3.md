# Phase Implementation Report

### Executed Phase
- Phase: phase-03-integration (Priority 1 — Commerce Flow)
- Plan: /Users/tvanlee/Documents/Đồ án/web/plans/260401-0813-backend-web-api-integration/
- Status: completed

### Files Modified / Created

| File | Action | Notes |
|------|--------|-------|
| `src/services/cart.service.ts` | Created | 5 endpoints: getCart, addToCart, removeFromCart, clearCart, isInCart |
| `src/services/order.service.ts` | Created | 7 endpoints: createOrder, getMyOrders, getOrder, cancelOrder, createPaymentIntent, getPaymentStatus, checkPayment |
| `src/services/voucher.service.ts` | Replaced | Removed all mock data; 14 real API endpoints (public + admin) |
| `src/hooks/queries/use-cart.ts` | Created | useCart, useIsInCart, useAddToCart, useRemoveFromCart, useClearCart |
| `src/hooks/queries/use-orders.ts` | Created | useMyOrders, useOrder, usePaymentStatus, useCreateOrder, useCancelOrder, useCreatePaymentIntent, useCheckPayment |
| `src/hooks/queries/use-voucher.ts` | Updated | usePublicVouchers, useMyVouchers, useVoucherByCode, useValidateVoucher, useApplyVoucher, useSaveVoucher, useUnsaveVoucher |
| `src/stores/cart.store.ts` | Updated | Syncs from API; adds optimisticAdd/optimisticRemove; backward-compat addItem/removeItem |
| `src/hooks/queries/index.ts` | Updated | Exports use-cart, use-orders, use-voucher |
| `src/types/voucher.ts` | Updated | snake_case fields matching API; removed BaseEntity dep |
| `src/app/(app)/my-vouchers/page.tsx` | Updated | Uses new snake_case Voucher fields; STATUS_CONFIG: "used" → "inactive" |
| `src/components/checkout/voucher-input.tsx` | Updated | `coursePrice` → `courseIds: string[]`; `discountAmount` → `discount_amount` |
| `src/components/checkout/checkout-modal.tsx` | Updated | Passes `courseIds={[course.id]}`; `discountAmount` → `discount_amount` |
| `src/components/course/course-detail-sidebar.tsx` | Updated | VoucherInput prop: `coursePrice` → `courseIds` |
| `src/stores/index.ts` | Updated | Re-exports CartItem from service, LegacyCartItem from store |

### Tasks Completed
- [x] Create `src/services/cart.service.ts`
- [x] Create `src/services/order.service.ts`
- [x] Replace mock in `src/services/voucher.service.ts`
- [x] Create `src/hooks/queries/use-cart.ts`
- [x] Create `src/hooks/queries/use-orders.ts`
- [x] Update `src/hooks/queries/use-voucher.ts`
- [x] Sync `cart.store.ts` with API shape + backward compat
- [x] Fix all downstream type breakages from API field renaming

### Tests Status
- Type check: pass (tsc via build)
- Build: `✓ Compiled successfully` — 44/44 static pages generated
- Unit tests: not run (no test suite configured)

### Issues Encountered
- **Field naming mismatch**: old voucher types used camelCase (`discountType`, `discountValue`, etc.); API uses snake_case. Required cascading updates to 4 files.
- **`VoucherInput` prop change**: `coursePrice: number` → `courseIds: string[]` — breaking for any caller not updated here. Found and fixed all 2 usages.
- **Cart store backward compat**: `course-detail-sidebar.tsx` used old `addItem({courseId, ...})` shape. Added `LegacyCartItem` adapter so existing code works while new code uses API-backed hooks.
- **`stores/index.ts`** re-exported `CartItem` from cart.store (no longer defined there) — redirected to `cart.service`.

### Next Steps
- Priority 2: `section.service.ts`, `lesson.service.ts`, `lesson-content.service.ts`, `category.service.ts` + hooks
- `course-detail-sidebar.tsx` still uses Zustand-only cart (no real API call on cart toggle) — should wire `useAddToCart`/`useRemoveFromCart` hooks to replace `addItem`/`removeItem` calls

### Unresolved Questions
- None
