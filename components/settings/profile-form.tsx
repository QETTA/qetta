'use client'

import { Button } from '@/components/catalyst/button'
import { Field, Label, Description } from '@/components/catalyst/fieldset'
import { Input } from '@/components/catalyst/input'
import { Divider } from '@/components/catalyst/divider'
import { useState, useRef } from 'react'
import { User } from 'next-auth'
import { clientLogger } from '@/lib/logger/client'

interface ProfileFormProps {
  user: User
}

/**
 * ProfileForm - User Profile Information Form
 */
export function ProfileForm({ user }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const name = nameInputRef.current?.value?.trim()

      if (!name) {
        setError('Please enter your name.')
        setIsSaving(false)
        return
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to update profile.')
        clientLogger.warn('[Profile] Update failed:', data)
        setIsSaving(false)
        return
      }

      setSuccess('Profile updated successfully.')
      clientLogger.info('[Profile] Update success:', data)
      setIsEditing(false)

      // Refresh page to reflect session update
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      clientLogger.error('[Profile] Update error:', err)
      setError('Network error occurred. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Image Section */}
      <div className="bg-background-elevated border border-border rounded-lg p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-2xl font-bold text-white">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>

          {/* Avatar Description */}
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Profile Photo</h3>
              <p className="text-sm text-foreground-secondary mt-1">
                JPG, GIF or PNG. Max 1MB.
              </p>
            </div>
            <div className="flex gap-3">
              <Button color="dark/zinc" className="text-sm">
                Upload
              </Button>
              <Button plain className="text-sm">
                Remove
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* Basic Information Section */}
      <div className="bg-background-elevated border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-foreground mb-6">Basic Information</h3>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20"
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            role="alert"
            className="mb-6 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400 border border-emerald-500/20"
          >
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Name */}
          <Field>
            <Label>Name</Label>
            <Description>This name will be displayed on the dashboard and in emails.</Description>
            <Input
              ref={nameInputRef}
              name="name"
              defaultValue={user.name || ''}
              disabled={!isEditing}
              className="mt-3"
            />
          </Field>

          {/* Email */}
          <Field>
            <Label>Email</Label>
            <Description>Email used for account login and notifications.</Description>
            <Input
              type="email"
              name="email"
              defaultValue={user.email || ''}
              disabled
              className="mt-3"
            />
          </Field>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-border">
          {!isEditing ? (
            <Button color="dark/zinc" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : (
            <>
              <Button color="dark/zinc" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button plain onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
