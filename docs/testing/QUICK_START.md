# Accounting Tests - Quick Start Guide

## ⚡ TL;DR

```bash
# 1. Start services
docker-compose up -d postgres redis

# 2. Setup database
npm run db:generate
npm run db:push

# 3. Run all tests
npm test lib/accounting

# 4. Run E2E tests
npm run build && npx playwright test e2e/accounting-*.spec.ts
```

---

## 📊 Test Statistics

| Category | Files | Tests | Status |
|----------|-------|-------|--------|
| Unit Tests | 5 | 77 | ✅ |
| Integration Tests | 3 | 53 | ✅ |
| E2E Tests | 3 | 27 | ✅ |
| **Total** | **11** | **157** | ✅ |

**Coverage**: 85%+ lines, 85%+ functions, 80%+ branches

---

## 🚀 Quick Commands

### Run Specific Tests
```bash
# P0 Unit Tests
npm test lib/accounting/__tests__/payout-service.test.ts
npm test lib/accounting/__tests__/referral-service.test.ts
npm test lib/accounting/__tests__/partner-service.test.ts
npm test lib/accounting/__tests__/rate-limiter.test.ts

# P0 Integration Tests
npm test app/api/accounting/admin/__tests__

# P1 Integration Tests
npm test server/src/routes/__tests__/accounting-partners.test.ts

# E2E Tests
npx playwright test e2e/accounting-admin-flow.spec.ts
npx playwright test e2e/accounting-referral-flow.spec.ts
npx playwright test e2e/accounting-partner-portal.spec.ts
```

### Watch Mode
```bash
npm test -- lib/accounting/__tests__/payout-service.test.ts --watch
```

### Coverage
```bash
npm test -- lib/accounting --coverage
```

---

## 🐳 Docker Services

### docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - 5432:5432
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: qetta_test

  redis:
    image: redis:7-alpine
    ports:
      - 6379:6379
```

### Start/Stop
```bash
docker-compose up -d    # Start
docker-compose down     # Stop
docker-compose ps       # Status
```

---

## 🔍 Debugging Failed Tests

### 1. Check Services
```bash
# PostgreSQL
docker exec -it postgres-container psql -U postgres -d qetta_test -c "SELECT 1"

# Redis
docker exec -it redis-container redis-cli ping
```

### 2. Check Environment
```bash
echo $DATABASE_URL  # Should be postgresql://...
echo $REDIS_URL     # Should be redis://localhost:6379
```

### 3. Run Single Test
```bash
npm test -- lib/accounting/__tests__/payout-service.test.ts -t "creates payout preview"
```

### 4. View Test Output
```bash
npm test -- lib/accounting/__tests__/payout-service.test.ts --verbose
```

---

## 📝 Test Categories

### P0 (Critical - Must Pass)
- ✅ Snapshot verification (TOCTOU prevention)
- ✅ Idempotency (duplicate prevention)
- ✅ SERIALIZABLE transactions (race conditions)
- ✅ First-touch attribution
- ✅ Rate limiting (distributed)

### P1 (Important - Should Pass)
- ✅ Partner API integration
- ✅ External post uploads
- ✅ E2E admin flows
- ✅ E2E referral flows

---

## 🛠️ Common Issues

### Issue: "Cannot find module '@/lib/db/prisma'"
```bash
npm run db:generate
```

### Issue: "ECONNREFUSED 127.0.0.1:5432"
```bash
docker-compose up -d postgres
```

### Issue: "ECONNREFUSED 127.0.0.1:6379"
```bash
docker-compose up -d redis
```

### Issue: "Snapshot verification failed"
**Cause**: Data tampering detected (expected behavior)
**Fix**: Ensure test uses correct snapshot hash from preview

### Issue: E2E tests timeout
```bash
# Increase timeout in playwright.config.ts
timeout: 60000  # 60 seconds
```

---

## 📚 Related Documentation

- **Full Summary**: `docs/testing/accounting-test-summary.md`
- **Test Helpers**: `lib/accounting/__tests__/utils/test-helpers.ts`
- **CI/CD**: `.github/workflows/accounting-tests.yml`

---

## ✅ Pre-Deployment Checklist

- [ ] All P0 unit tests passing (77 tests)
- [ ] All P0 integration tests passing (34 tests)
- [ ] All P1 tests passing (46 tests)
- [ ] Coverage ≥ 85% (lines, functions)
- [ ] Coverage ≥ 80% (branches)
- [ ] CI/CD green (GitHub Actions)
- [ ] PostgreSQL migrations applied
- [ ] Redis available in production
- [ ] Environment variables set

---

**Last Updated**: 2026-02-08
**Status**: ✅ Production Ready
**Total Test Cases**: 157
