'use client'

import { Button } from '@/components/catalyst/button'
import { Field, Label, Description } from '@/components/catalyst/fieldset'
import { Input } from '@/components/catalyst/input'
import { Divider } from '@/components/catalyst/divider'
import { useState, useRef } from 'react'
import { clientLogger } from '@/lib/logger/client'

interface AccountFormProps {
  userId: string
}

/**
 * AccountForm - Account Security and Management Form
 */
export function AccountForm({ userId }: AccountFormProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const currentPasswordRef = useRef<HTMLInputElement>(null)
  const newPasswordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  const handlePasswordChange = async () => {
    setIsChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    try {
      const currentPassword = currentPasswordRef.current?.value
      const newPassword = newPasswordRef.current?.value
      const confirmPassword = confirmPasswordRef.current?.value

      // Client-side validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordError('Please fill in all fields.')
        setIsChangingPassword(false)
        return
      }

      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match.')
        setIsChangingPassword(false)
        return
      }

      if (newPassword.length < 8) {
        setPasswordError('Password must be at least 8 characters.')
        setIsChangingPassword(false)
        return
      }

      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPasswordError(data.message || 'Failed to change password.')
        clientLogger.warn('[Account] Password change failed:', data)
        setIsChangingPassword(false)
        return
      }

      setPasswordSuccess('Password changed successfully.')
      clientLogger.info('[Account] Password change success')

      // Clear input fields
      if (currentPasswordRef.current) currentPasswordRef.current.value = ''
      if (newPasswordRef.current) newPasswordRef.current.value = ''
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = ''
    } catch (err) {
      clientLogger.error('[Account] Password change error:', err)
      setPasswordError('Network error occurred. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Change Password Section */}
      <div className="bg-background-elevated border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-foreground mb-6">Change Password</h3>

        <div className="space-y-6">
          <Field>
            <Label>Current Password</Label>
            <Input
              ref={currentPasswordRef}
              type="password"
              name="current-password"
              autoComplete="current-password"
            />
          </Field>

          <Field>
            <Label>New Password</Label>
            <Description>Minimum 8 characters with letters, numbers, and special characters</Description>
            <Input
              ref={newPasswordRef}
              type="password"
              name="new-password"
              autoComplete="new-password"
              className="mt-3"
            />
          </Field>

          <Field>
            <Label>Confirm Password</Label>
            <Input
              ref={confirmPasswordRef}
              type="password"
              name="confirm-password"
              autoComplete="new-password"
            />
          </Field>

          {/* Error Message */}
          {passwordError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm text-red-400">{passwordError}</p>
            </div>
          )}

          {/* Success Message */}
          {passwordSuccess && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
              <p className="text-sm text-green-400">{passwordSuccess}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-border">
          <Button
            color="dark/zinc"
            onClick={handlePasswordChange}
            disabled={isChangingPassword}
          >
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </div>

      <Divider />

      {/* API Key Management Section */}
      <div className="bg-background-elevated border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-foreground mb-6">API Key Management</h3>

        <div className="space-y-4">
          <div>
            <Label>API Key</Label>
            <Description className="mb-3">
              Your personal API key for external system integrations.
            </Description>
            <div className="flex gap-3">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value="qetta_1234567890abcdef"
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button plain onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? 'Hide' : 'Show'}
              </Button>
              <Button color="dark/zinc">Copy</Button>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Button outline>Generate New API Key</Button>
            <p className="text-xs text-foreground-muted mt-2">
              Generating a new key will immediately invalidate the existing key.
            </p>
          </div>
        </div>
      </div>

      <Divider />

      {/* Active Sessions Section */}
      <div className="bg-background-elevated border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-foreground mb-6">Active Sessions</h3>

        <div className="space-y-4">
          {/* Current Session */}
          <div className="flex items-start justify-between p-4 bg-background-hover rounded-lg border border-border-subtle">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground">
                  Chrome on macOS
                </p>
                <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-light">
                  Current Session
                </span>
              </div>
              <p className="text-xs text-foreground-secondary">
                Seoul, South Korea • Active just now
              </p>
            </div>
          </div>

          {/* Other Sessions (Example) */}
          <div className="flex items-start justify-between p-4 rounded-lg border border-border-subtle hover:bg-background-hover transition-colors">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Safari on iOS
              </p>
              <p className="text-xs text-foreground-secondary">
                Seoul, South Korea • Active 2 hours ago
              </p>
            </div>
            <Button plain className="text-sm text-foreground-secondary hover:text-foreground">
              End
            </Button>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-border">
          <Button outline>End All Sessions</Button>
        </div>
      </div>

      <Divider />

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-6">
        <h3 className="text-base font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-foreground-secondary mb-6">
          Deleting your account will permanently remove all your data.
        </p>
        <Button color="red">Delete Account</Button>
      </div>
    </div>
  )
}
