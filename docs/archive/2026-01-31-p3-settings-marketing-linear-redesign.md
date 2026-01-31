# P3 Settings & Marketing - Linear Style Redesign Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate settings components and marketing pages to Linear-style titanium silver/deep gray design with English text

**Architecture:** Systematic replacement of violet → zinc/white, Korean → English across 28 files

**Tech Stack:** Next.js App Router, Tailwind CSS, Headless UI

---

## 📊 File Count Summary

| Domain | Files |
|--------|-------|
| components/settings/ | 3 |
| app/(marketing)/ | 17 |
| app/(dashboard)/settings/ | 8 |
| **Total** | **28** |

---

## 📁 Batch A: Settings Components (3 files)

### Task A1: Settings Forms

**Files:**
- `components/settings/account-form.tsx`
- `components/settings/profile-form.tsx`
- `components/settings/notifications-form.tsx`

**Changes:**

**Korean → English translations:**
```
계정 설정 → Account Settings
프로필 → Profile
알림 → Notifications
저장 → Save
취소 → Cancel
이메일 → Email
비밀번호 → Password
이름 → Name
전화번호 → Phone
알림 받기 → Receive notifications
이메일 알림 → Email notifications
푸시 알림 → Push notifications
마케팅 수신 → Marketing emails
변경사항 저장 → Save changes
```

**Color changes:**
```
violet-* → zinc-* / white
focus:ring-violet-* → focus:ring-white/30
```

**Commit:** `refactor(settings): update settings forms to Linear style + English`

---

## 📁 Batch B: Marketing Pages (17 files)

### Task B1: Marketing Layout & Error

**Files:**
- `app/(marketing)/layout.tsx`
- `app/(marketing)/error.tsx`
- `app/(marketing)/page.tsx`

**Changes:**
1. Update metadata to English
2. Update violet → zinc/white
3. Translate Korean text

**Commit:** `refactor(marketing-core): update marketing core to Linear style`

---

### Task B2: Product & Features Pages

**Files:**
- `app/(marketing)/product/page.tsx`
- `app/(marketing)/features/page.tsx`
- `app/(marketing)/how-it-works/page.tsx`
- `app/(marketing)/pricing/page.tsx`

**Changes:**

**Metadata translations:**
```tsx
// product/page.tsx
title: '제품 소개 | QETTA' → 'Product | QETTA'
description: 'QETTA 제품 기능을 알아보세요' → 'Discover QETTA product features'

// features/page.tsx
title: '기능 | QETTA' → 'Features | QETTA'
description: 'QETTA의 핵심 기능' → 'Core features of QETTA'

// how-it-works/page.tsx
title: '사용 방법 | QETTA' → 'How It Works | QETTA'
description: 'QETTA 사용법' → 'Learn how to use QETTA'

// pricing/page.tsx
title: '요금제 | QETTA' → 'Pricing | QETTA'
description: 'QETTA 요금제' → 'QETTA pricing plans'
```

**Commit:** `refactor(marketing-product): update product pages to Linear style`

---

### Task B3: Company Page

**Files:**
- `app/(marketing)/company/page.tsx`

**Changes:**
```tsx
title: '회사 소개 | QETTA' → 'About | QETTA'
description: 'QETTA를 만드는 팀' → 'The team behind QETTA'
```

**Commit:** `refactor(marketing-company): update company page to Linear style`

---

### Task B4: Solutions Pages

**Files:**
- `app/(marketing)/solutions/companies/page.tsx`
- `app/(marketing)/solutions/partners/page.tsx`

**Changes:**
```tsx
// solutions/companies/page.tsx
title: '기업 솔루션 | QETTA' → 'Enterprise Solutions | QETTA'

// solutions/partners/page.tsx
title: '파트너 솔루션 | QETTA' → 'Partner Solutions | QETTA'
```

**Commit:** `refactor(marketing-solutions): update solutions pages to Linear style`

---

### Task B5: Partners Pages

**Files:**
- `app/(marketing)/partners/page.tsx`
- `app/(marketing)/partners/buyers/page.tsx`
- `app/(marketing)/partners/buyers/layout.tsx`
- `app/(marketing)/partners/suppliers/page.tsx`
- `app/(marketing)/partners/suppliers/layout.tsx`
- `app/(marketing)/partners/consultants/page.tsx`
- `app/(marketing)/partners/consultants/layout.tsx`

**Changes:**
```tsx
// partners/page.tsx
title: '파트너 | QETTA' → 'Partners | QETTA'

// buyers
title: '바이어 | QETTA' → 'Buyers | QETTA'

// suppliers
title: '공급사 | QETTA' → 'Suppliers | QETTA'

// consultants
title: '컨설턴트 | QETTA' → 'Consultants | QETTA'
```

**Commit:** `refactor(marketing-partners): update partners pages to Linear style`

---

## 📁 Batch C: Dashboard Settings Pages (8 files)

### Task C1: Settings Core Pages

**Files:**
- `app/(dashboard)/settings/profile/page.tsx`
- `app/(dashboard)/settings/account/page.tsx`
- `app/(dashboard)/settings/notifications/page.tsx`

**Changes:**
```tsx
// profile/page.tsx
title: '프로필 설정 | QETTA' → 'Profile Settings | QETTA'

// account/page.tsx
title: '계정 설정 | QETTA' → 'Account Settings | QETTA'

// notifications/page.tsx
title: '알림 설정 | QETTA' → 'Notification Settings | QETTA'
```

**Commit:** `refactor(settings-pages): update settings pages to Linear style`

---

### Task C2: Billing Pages

**Files:**
- `app/(dashboard)/settings/billing/page.tsx`
- `app/(dashboard)/settings/billing/billing-client.tsx`
- `app/(dashboard)/settings/billing/checkout/page.tsx`
- `app/(dashboard)/settings/billing/success/page.tsx`
- `app/(dashboard)/settings/billing/fail/page.tsx`

**Changes:**
```tsx
// billing/page.tsx
title: '결제 | QETTA' → 'Billing | QETTA'

// checkout/page.tsx
title: '결제하기 | QETTA' → 'Checkout | QETTA'

// success/page.tsx
title: '결제 완료 | QETTA' → 'Payment Successful | QETTA'
'결제가 완료되었습니다' → 'Payment completed successfully'

// fail/page.tsx
title: '결제 실패 | QETTA' → 'Payment Failed | QETTA'
'결제에 실패했습니다' → 'Payment failed'
```

**Korean text in billing-client.tsx:**
```
요금제 → Plan
결제 수단 → Payment method
다음 결제일 → Next billing date
월간 → Monthly
연간 → Annual
취소 → Cancel
업그레이드 → Upgrade
다운그레이드 → Downgrade
```

**Commit:** `refactor(billing): update billing pages to Linear style`

---

## ✅ Verification

```bash
# Check for remaining violet
grep -r "violet" components/settings/ app/\(marketing\)/ app/\(dashboard\)/settings/

# Check for remaining Korean
grep -r "[가-힣]" components/settings/ app/\(marketing\)/ app/\(dashboard\)/settings/

# Build check
npm run build
```

---

## 📊 Estimated Time

| Batch | Files | Est. Time |
|-------|-------|-----------|
| A: Settings Components | 3 | 30 min |
| B: Marketing Pages | 17 | 2 hours |
| C: Dashboard Settings | 8 | 1 hour |
| **Total** | **28** | **3.5 hours** |

---

**Last Updated:** 2026-01-31
**Plan Version:** v1.0 (P3 Settings & Marketing)
