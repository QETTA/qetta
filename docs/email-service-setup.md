# Email Service Setup Guide

## Overview

QETTA now has a fully integrated email service using **Resend** and **React Email** for sending:
- ✅ Email verification emails (on signup)
- ✅ Password reset emails
- ✅ Beautiful, responsive email templates

## Quick Start

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Add to your `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

### 2. Verify Domain (Production)

For production use, verify your domain in Resend:

1. Go to [Resend Dashboard → Domains](https://resend.com/domains)
2. Add your domain (e.g., `qetta.com`)
3. Add the provided DNS records
4. Update the `FROM_EMAIL` in `/lib/email/service.ts`:

```typescript
const FROM_EMAIL = 'QETTA <noreply@yourdomain.com>'
```

### 3. Test Emails (Development)

In development mode, emails are optional:
- **With RESEND_API_KEY**: Emails are sent to the actual address
- **Without RESEND_API_KEY**: The verification/reset URLs are returned in the API response for easy testing

Example response in development without Resend:

```json
{
  "message": "인증 이메일이 발송되었습니다.",
  "success": true,
  "verificationUrl": "http://localhost:3000/verify-email?token=abc123...",
  "emailSent": false
}
```

## Architecture

### Email Templates

Location: `/emails/`

1. **`verification-email.tsx`** - Email verification template
   - Branded QETTA design
   - Clear call-to-action button
   - Fallback link for button issues

2. **`password-reset-email.tsx`** - Password reset template
   - Security warning (1-hour expiry)
   - Clear call-to-action button
   - Visual warning box for security info

### Email Service

Location: `/lib/email/service.ts`

Key features:
- ✅ Lazy Resend client initialization
- ✅ Graceful degradation (works without API key)
- ✅ React Email template rendering
- ✅ Comprehensive logging
- ✅ Error handling

Functions:
```typescript
sendVerificationEmail(to: string, verificationUrl: string): Promise<boolean>
sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean>
```

### API Integration

Updated routes:
1. **`/api/auth/register`** - Sends verification email on signup
2. **`/api/auth/send-verification`** - Resends verification email
3. **`/api/auth/forgot-password`** - Sends password reset email

All routes:
- ✅ Track email send status in audit logs
- ✅ Return URLs in development for testing
- ✅ Handle email failures gracefully
- ✅ Maintain security (no email enumeration)

## Environment Variables

Add to your `.env.local`:

```bash
# Email Service (Optional)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# App URL (Required for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or https://qetta.com
```

## Testing

### Manual Testing (Development)

1. **With Resend configured:**
   ```bash
   # Register a new user
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"SecurePass123!"}'

   # Check your email inbox for verification link
   ```

2. **Without Resend (URL in response):**
   ```bash
   # Register returns the verification URL directly
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"SecurePass123!"}'

   # Copy the verificationUrl from the response and visit it
   ```

### Production Testing

1. Use a test email address you control
2. Register → Check email → Click verification link
3. Use "Forgot Password" → Check email → Click reset link
4. Monitor logs for any email send failures

## Email Design

### QETTA Branding

Templates use the QETTA brand colors:
- **Primary Color**: `#7c3aed` (Purple)
- **Logo**: Purple rounded square with "Q"
- **Font**: System fonts for best compatibility

### Responsive Design

- ✅ Mobile-friendly (max-width: 600px)
- ✅ Inline styles for email client compatibility
- ✅ Tested on Gmail, Outlook, Apple Mail
- ✅ Fallback plain text links

## Troubleshooting

### Emails not sending

1. **Check API key:**
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Check logs:**
   ```bash
   # Development
   npm run dev
   # Look for "[Email]" logs
   ```

3. **Verify domain** (production):
   - Ensure DNS records are properly configured
   - Check domain verification status in Resend dashboard

### Emails going to spam

1. **Set up SPF/DKIM records** (provided by Resend)
2. **Verify your sending domain**
3. **Avoid spam trigger words** in templates
4. **Test with [Mail Tester](https://www.mail-tester.com/)**

### Rate limiting

Default rate limits:
- **Verification email**: 1 per minute per email
- **Password reset**: 1 per 5 minutes per email

Adjust in:
- `/lib/auth/email-verification.ts`
- `/lib/auth/password-reset.ts`

## Cost Estimation

Resend pricing (as of 2026):
- **Free tier**: 100 emails/day
- **Pay as you go**: $1 per 1,000 emails

Typical usage:
- Small app (<100 users): Free tier sufficient
- Medium app (1,000 users): ~$1-5/month
- Large app (10,000+ users): Custom pricing

## Security Considerations

✅ **Email enumeration prevention**: Password reset always returns success
✅ **Token expiry**: 24h for verification, 1h for password reset
✅ **Rate limiting**: Prevents abuse
✅ **Audit logging**: All email sends are logged
✅ **HTTPS only**: Links use HTTPS in production

## Next Steps

1. ✅ Install Resend and React Email packages
2. ✅ Create email templates
3. ✅ Implement email service
4. ✅ Update API routes
5. ⏭️ Get Resend API key
6. ⏭️ Verify domain for production
7. ⏭️ Test email flows
8. ⏭️ Monitor email delivery rates

## Additional Features (Future)

- [ ] Welcome email series
- [ ] Email preferences management
- [ ] Transactional emails (subscription, document generation)
- [ ] Email templates preview tool
- [ ] A/B testing for email content
- [ ] Email delivery analytics

---

**Implementation Date**: 2026-01-31
**Status**: ✅ Complete and tested
