# CampusCart Firestore Security Specification

## 1. Data Invariants
1. A `UserProfile` document at `/users/{userId}/private/profile` can only be read or written by the authenticated, email-verified user whose `request.auth.uid == userId`, with `uid == request.auth.uid`.
2. A `HostelOrder` document at `/orders/{orderId}` can only be created by an authenticated, email-verified user setting `userId == request.auth.uid`, initial `status == 'Confirmed'`, server timestamp `createdAt == request.time`, and bounded item lines (`1 <= itemLines.size() <= 25`).
3. List queries on `/orders` must be bound by `resource.data.userId == request.auth.uid`.
4. Orders in a terminal status (`Delivered`, `Cancelled`) cannot be modified. Users may only cancel an active `Confirmed` order by updating `status` to `Cancelled`.

## 2. The "Dirty Dozen" Rejection Payloads
1. **Unauthenticated read/write** (`request.auth == null`) -> PERMISSION_DENIED.
2. **Unverified email write** (`request.auth.token.email_verified == false`) -> PERMISSION_DENIED.
3. **UID spoofing on order create** (`userId: "other-uid"`) -> PERMISSION_DENIED.
4. **Shadow field injection on profile** (`{ ..., isAdmin: true }`) -> PERMISSION_DENIED.
5. **Shadow field injection on order** (`{ ..., waivedFee: true }`) -> PERMISSION_DENIED.
6. **Oversized document ID** (`orderId` length > 128 or invalid chars) -> PERMISSION_DENIED.
7. **Forged server timestamp** (`createdAt: "2026-01-01T00:00:00Z"`) -> PERMISSION_DENIED.
8. **Negative order total** (`total: -500`) -> PERMISSION_DENIED.
9. **Empty or unbounded itemLines array** (`itemLines: []` or > 25 items) -> PERMISSION_DENIED.
10. **Non-string element in itemLines[0]** (`itemLines: [123]`) -> PERMISSION_DENIED.
11. **Cross-user order read/list** (reading another user's `/orders/{orderId}`) -> PERMISSION_DENIED.
12. **Mutating terminal order** (updating `status` when existing `status == 'Delivered'`) -> PERMISSION_DENIED.
