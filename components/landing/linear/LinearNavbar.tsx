'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useScrollNavbar } from '@/hooks/use-scroll-navbar'
import { cn } from '@/lib/utils'
import { LinearButton } from './LinearButton'
import { QettaLogoIcon } from '@/components/icons/qetta-logo-icon'

// Navigation items
const navItems = [
  { label: 'Features', href: '/features' },
  { label: 'How it Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Company', href: '/company' },
] as const

/**
 * LinearNavbar - Scroll-responsive navigation with blur effect
 * Inspired by Linear's navbar design
 */
export function LinearNavbar() {
  const isScrolled = useScrollNavbar(50)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Mobile menu scroll lock
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-[var(--background)]/95 backdrop-blur-xl border-b border-[var(--border)]'
          : 'bg-transparent'
      )}
    >
      <nav
        className="max-w-[1200px] mx-auto h-14 px-6 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <QettaLogoIcon className="w-6 h-6 text-[var(--foreground)]" />
          <span className="text-[15px] font-semibold text-[var(--foreground)]">
            QETTA
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="h-14 px-3 flex items-center text-[13px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA - Linear style Titanium deep gray */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/docs"
            className="text-[13px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            Docs
          </Link>
          <Link href="/login">
            <LinearButton size="sm">Get Started</LinearButton>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 text-[var(--foreground)]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-14 bg-[var(--background)] z-40 p-6">
          <nav className="space-y-4" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-3 text-[17px] text-[var(--foreground)] border-b border-[var(--border)]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-6 space-y-3">
              <Link href="/docs" onClick={() => setMobileOpen(false)}>
                <LinearButton variant="secondary" className="w-full">
                  Docs
                </LinearButton>
              </Link>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <LinearButton className="w-full">Get Started</LinearButton>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
