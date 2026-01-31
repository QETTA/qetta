'use client'

import { Button } from '@/components/catalyst/button'
import { Field, Label, Description } from '@/components/catalyst/fieldset'
import { Checkbox } from '@/components/catalyst/checkbox'
import { Divider } from '@/components/catalyst/divider'
import { useState, useEffect } from 'react'
import { clientLogger } from '@/lib/logger/client'

interface NotificationsFormProps {
  userId: string
}

/**
 * API Notification Settings Structure
 */
interface NotificationPreferences {
  email?: {
    applicationStatus?: boolean
    documentGeneration?: boolean
    systemUpdates?: boolean
    weeklyDigest?: boolean
    marketingEmails?: boolean
  }
  push?: {
    applicationUpdates?: boolean
    documentReady?: boolean
    systemAlerts?: boolean
  }
}

/**
 * NotificationsForm - Notification Preferences Form
 */
export function NotificationsForm({ userId }: NotificationsFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Notification settings state (mapped to API structure)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      applicationStatus: true,
      documentGeneration: true,
      systemUpdates: true,
      weeklyDigest: true,
      marketingEmails: false,
    },
    push: {
      applicationUpdates: true,
      documentReady: true,
      systemAlerts: true,
    },
  })

  // Load initial settings
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/user/notifications')
        const data = await response.json()

        if (!response.ok) {
          clientLogger.warn('[Notifications] Failed to load preferences:', data)
          // Use default values even if failed
          setIsLoading(false)
          return
        }

        if (data.preferences) {
          setPreferences(data.preferences)
        }
        setIsLoading(false)
      } catch (err) {
        clientLogger.error('[Notifications] Load error:', err)
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to save notification settings.')
        clientLogger.warn('[Notifications] Save failed:', data)
        setIsSaving(false)
        return
      }

      setSuccessMessage('Notification settings saved.')
      clientLogger.info('[Notifications] Save success')
    } catch (err) {
      clientLogger.error('[Notifications] Save error:', err)
      setError('Network error occurred. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEmailToggle = (key: keyof NonNullable<NotificationPreferences['email']>) => {
    setError(null)
    setSuccessMessage(null)
    setPreferences(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: !prev.email?.[key],
      },
    }))
  }

  const handlePushToggle = (key: keyof NonNullable<NotificationPreferences['push']>) => {
    setError(null)
    setSuccessMessage(null)
    setPreferences(prev => ({
      ...prev,
      push: {
        ...prev.push,
        [key]: !prev.push?.[key],
      },
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-secondary">Loading notification settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
          <p className="text-sm text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Email Notifications Section */}
      <div className="bg-background-elevated border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-foreground mb-6">Email Notifications</h3>

        <div className="space-y-6">
          {/* Marketing Emails */}
          <Field className="flex items-start gap-4">
            <Checkbox
              checked={preferences.email?.marketingEmails ?? false}
              onChange={() => handleEmailToggle('marketingEmails')}
              className="mt-1"
            />
            <div className="flex-1">
              <Label>Marketing & Newsletter</Label>
              <Description>
                Receive product updates, tips, events, and discount information.
              </Description>
            </div>
          </Field>

          {/* Weekly Digest */}
          <Field className="flex items-start gap-4">
            <Checkbox
              checked={preferences.email?.weeklyDigest ?? true}
              onChange={() => handleEmailToggle('weeklyDigest')}
              className="mt-1"
            />
            <div className="flex-1">
              <Label>Weekly Digest</Label>
              <Description>
                Receive weekly activity summaries and insights.
              </Description>
            </div>
          </Field>

          {/* System Updates */}
          <Field className="flex items-start gap-4">
            <Checkbox
              checked={preferences.email?.systemUpdates ?? true}
              onChange={() => handleEmailToggle('systemUpdates')}
              className="mt-1"
            />
            <div className="flex-1">
              <Label>System Updates</Label>
              <Description>
                Receive notifications about new features, improvements, and system changes.
              </Description>
            </div>
          </Field>

          {/* Document Notifications */}
          <Field className="flex items-start gap-4">
            <Checkbox
              checked={preferences.email?.documentGeneration ?? true}
              onChange={() => handleEmailToggle('documentGeneration')}
              className="mt-1"
            />
            <div className="flex-1">
              <Label>Document Generation Complete</Label>
              <Description>
                Get notified via email when document generation is complete.
              </Description>
            </div>
          </Field>

          {/* Application Status */}
          <Field className="flex items-start gap-4">
            <Checkbox
              checked={preferences.email?.applicationStatus ?? true}
              onChange={() => handleEmailToggle('applicationStatus')}
              className="mt-1"
            />
            <div className="flex-1">
              <Label>Application Status Changes</Label>
              <Description>
                Get notified when the status of your applications changes.
              </Description>
            </div>
          </Field>
        </div>
      </div>

      <Divider />

      {/* Push Notifications Section */}
      <div className="bg-background-elevated border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-foreground mb-6">Push Notifications</h3>

        <div className="space-y-6">
          {/* Document Push */}
          <Field className="flex items-start gap-4">
            <Checkbox
              checked={preferences.push?.documentReady ?? true}
              onChange={() => handlePushToggle('documentReady')}
              className="mt-1"
            />
            <div className="flex-1">
              <Label>Document Generation Complete</Label>
              <Description>
                Get instant browser push notifications when documents are ready.
              </Description>
            </div>
          </Field>

          {/* Application Push */}
          <Field className="flex items-start gap-4">
            <Checkbox
              checked={preferences.push?.applicationUpdates ?? true}
              onChange={() => handlePushToggle('applicationUpdates')}
              className="mt-1"
            />
            <div className="flex-1">
              <Label>Application Alerts</Label>
              <Description>
                Receive new announcement and deadline notifications.
              </Description>
            </div>
          </Field>

          {/* System Push */}
          <Field className="flex items-start gap-4">
            <Checkbox
              checked={preferences.push?.systemAlerts ?? true}
              onChange={() => handlePushToggle('systemAlerts')}
              className="mt-1"
            />
            <div className="flex-1">
              <Label>System Alerts</Label>
              <Description>
                Receive important system notifications immediately.
              </Description>
            </div>
          </Field>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button color="dark/zinc" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
