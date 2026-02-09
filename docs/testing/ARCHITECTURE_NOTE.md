# Accounting Module Testing Architecture

## Project Structure Discovery

During implementation, we discovered that this project uses **Express.js** backend, not Next.js App Router for API routes.

### What Was Removed

The following Next.js-specific files were removed because Next.js is not installed:
- `app/api/accounting/admin/**/*.ts` - Next.js API routes (12 files)
- `e2e/accounting-*.spec.ts` - Playwright E2E tests (3 files)

### What Remains (Working)

✅ **Unit Tests** (4 files, 77 tests):
- `lib/accounting/__tests__/payout-service.test.ts`
- `lib/accounting/__tests__/referral-service.test.ts`
- `lib/accounting/__tests__/partner-service.test.ts`
- `lib/accounting/__tests__/rate-limiter.test.ts`

✅ **Integration Tests** (1 file, 19 tests):
- `server/src/routes/__tests__/accounting-partners.test.ts`

✅ **Express API Routes** (1 file):
- `server/src/routes/accounting-partners.ts`

### CI/CD Configuration

Updated `.github/workflows/accounting-tests.yml`:
- Removed `e2e-tests` job (no Playwright tests)
- Updated `integration-tests` to only test Express routes
- Kept `unit-tests` job (works with current setup)

### Next Steps (If Next.js Integration Needed)

If the project needs to add Next.js in the future:

1. Add Next.js dependencies to `package.json`:
   ```json
   {
     "dependencies": {
       "next": "^16.0.0",
       "react": "^19.0.0",
       "react-dom": "^19.0.0"
     }
   }
   ```

2. Re-implement the removed API routes in `app/api/accounting/`

3. Re-enable the E2E tests

### Total Test Coverage

- **96 tests** across unit and integration levels
- **Target Coverage**: 85% lines, 85% functions, 80% branches
- **Focus**: Financial correctness, security, performance
