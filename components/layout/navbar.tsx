'use client'

/**
 * Navbar - Comprehensive navigation with dropdown menus
 *
 * Features:
 * - Desktop: Headless UI Menu dropdowns
 * - Mobile: Nested Disclosure accordion
 * - Solutions (Companies, Partners)
 * - Partners (Consultants, Buyers, Suppliers)
 * - Static links (Features, How it Works, Pricing)
 *
 * @module layout/navbar
 */

import { useState, useEffect } from 'react'
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react'
import { Bars2Icon, ChevronDownIcon } from '@heroicons/react/24/solid'
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ShoppingCartIcon,
  TruckIcon,
  SparklesIcon,
  ArrowPathIcon,
  CubeIcon,
} from '@heroicons/react/24/outline'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/qetta-logo'
import { PlusGrid, PlusGridItem, PlusGridRow } from '@/components/marketing/plus-grid'
import { cn } from '@/lib/utils'

/**
 * Dropdown menu configuration
 */
const dropdownMenus = [
  {
    label: 'Solutions',
    items: [
      {
        href: '/solutions/companies',
        label: 'For Companies',
        description: 'Enterprise compliance automation',
        icon: BuildingOfficeIcon,
      },
      {
        href: '/solutions/partners',
        label: 'For Partners',
        description: 'B2B2B white-label platform',
        icon: UserGroupIcon,
      },
    ],
  },
  {
    label: 'Partners',
    items: [
      {
        href: '/partners/consultants',
        label: 'Consultants',
        description: 'Consulting partnership',
        icon: AcademicCapIcon,
      },
      {
        href: '/partners/buyers',
        label: 'Buyers',
        description: 'Buyer partnership',
        icon: ShoppingCartIcon,
      },
      {
        href: '/partners/suppliers',
        label: 'Suppliers',
        description: 'Supplier partnership',
        icon: TruckIcon,
      },
    ],
  },
]

/**
 * Static navigation links
 */
const staticLinks = [
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How it Works' },
  { href: '/pricing', label: 'Pricing' },
]

/**
 * Primary CTA for dashboard access
 */
const dashboardLink = { href: '/docs', label: 'Dashboard' }

function DesktopNav() {
  return (
    <nav className="relative hidden lg:flex items-center gap-1">
      {/* Dropdown Menus */}
      {dropdownMenus.map((menu) => (
        <Menu key={menu.label} as="div" className="relative">
          <MenuButton className="flex items-center gap-1 px-4 py-3 text-base font-semibold text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 focus-visible:rounded-lg">
            {menu.label}
            <ChevronDownIcon className="h-4 w-4" />
          </MenuButton>

          <MenuItems
            transition
            className="absolute left-0 mt-2 w-72 origin-top-left rounded-lg bg-zinc-900/95 backdrop-blur-xl p-2 ring-1 ring-white/10 shadow-xl transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 z-50"
          >
            {menu.items.map((item) => (
              <MenuItem key={item.href}>
                {({ focus }) => (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-start gap-3 rounded-lg p-3 transition-colors',
                      focus && 'bg-white/5'
                    )}
                  >
                    <item.icon className="h-5 w-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-zinc-100">
                        {item.label}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )}
              </MenuItem>
            ))}
          </MenuItems>
        </Menu>
      ))}

      {/* Static Links */}
      {staticLinks.map(({ href, label }) => (
        <PlusGridItem key={href} className="relative flex">
          <Link
            href={href}
            className="flex items-center px-4 py-3 text-base font-semibold text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 focus-visible:rounded-lg"
          >
            {label}
          </Link>
        </PlusGridItem>
      ))}

      {/* Dashboard CTA Button */}
      <PlusGridItem className="relative flex ml-2">
        <Link
          href={dashboardLink.href}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-zinc-600 rounded-full ring-1 ring-zinc-500/50 transition-colors hover:bg-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          {dashboardLink.label}
        </Link>
      </PlusGridItem>
    </nav>
  )
}

function MobileNavButton() {
  return (
    <DisclosureButton
      className="flex size-12 min-w-[48px] min-h-[48px] items-center justify-center self-center rounded-lg bg-zinc-800/50 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white active:bg-zinc-700 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 ring-1 ring-white/10"
      aria-label="Open main menu"
    >
      <Bars2Icon className="size-6" />
    </DisclosureButton>
  )
}

function MobileNav() {
  const [isAnimating, setIsAnimating] = useState(false)

  // Trigger animation when panel opens
  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsAnimating(true))
    return () => {
      cancelAnimationFrame(timer)
      setIsAnimating(false)
    }
  }, [])

  return (
    <DisclosurePanel className="lg:hidden">
      <div className="flex flex-col gap-2 py-4 px-2">
        {/* Dropdown Menus - Mobile Nested Disclosure */}
        {dropdownMenus.map((menu, menuIndex) => (
          <Disclosure key={menu.label} as="div">
            {({ open }) => (
              <div
                className={cn(
                  'transition-all duration-300 ease-out',
                  'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
                  isAnimating
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-1'
                )}
                style={{
                  transitionDelay: isAnimating ? `${menuIndex * 50}ms` : '0ms',
                }}
              >
                <DisclosureButton className="flex w-full items-center justify-between px-4 py-3 min-h-[48px] text-base font-semibold text-zinc-300 transition-colors hover:text-white hover:bg-zinc-800/50 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50">
                  <span>{menu.label}</span>
                  <ChevronDownIcon
                    className={cn(
                      'h-5 w-5 transition-transform duration-200',
                      open && 'rotate-180'
                    )}
                  />
                </DisclosureButton>

                <DisclosurePanel className="space-y-1 pl-4 mt-1">
                  {menu.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 py-2 px-3 text-sm text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800/30"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-zinc-500">{item.description}</div>
                      </div>
                    </Link>
                  ))}
                </DisclosurePanel>
              </div>
            )}
          </Disclosure>
        ))}

        {/* Static Links */}
        {staticLinks.map(({ href, label }, linkIndex) => {
          const delayIndex = dropdownMenus.length + linkIndex
          return (
            <div
              key={href}
              className={cn(
                'transition-all duration-300 ease-out',
                'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
                isAnimating
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-1'
              )}
              style={{
                transitionDelay: isAnimating ? `${delayIndex * 50}ms` : '0ms',
              }}
            >
              <Link
                href={href}
                className="block px-4 py-3 min-h-[48px] text-base font-semibold text-zinc-300 transition-colors hover:text-white hover:bg-zinc-800/50 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50"
              >
                {label}
              </Link>
            </div>
          )
        })}

        {/* Dashboard CTA - Mobile */}
        <div
          className={cn(
            'transition-all duration-300 ease-out mt-2',
            'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
            isAnimating
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-1'
          )}
          style={{
            transitionDelay: isAnimating ? `${(dropdownMenus.length + staticLinks.length + 1) * 50}ms` : '0ms',
          }}
        >
          <Link
            href={dashboardLink.href}
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] text-base font-semibold text-white bg-zinc-600 rounded-lg ring-1 ring-zinc-500/50 transition-colors hover:bg-zinc-500 active:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            {dashboardLink.label}
          </Link>
        </div>
      </div>
      <div className="absolute left-1/2 w-screen -translate-x-1/2">
        <div className="absolute inset-x-0 top-0 border-t border-white/5" />
        <div className="absolute inset-x-0 top-2 border-t border-white/5" />
      </div>
    </DisclosurePanel>
  )
}

export function Navbar({ banner }: { banner?: React.ReactNode }) {
  return (
    <Disclosure as="header" className="pt-12 sm:pt-16 bg-zinc-950/80 backdrop-blur-xl">
      <PlusGrid>
        <PlusGridRow className="relative flex justify-between">
          <div className="relative flex gap-6">
            <PlusGridItem className="py-3">
              <Link href="/" title="Home">
                <Logo className="h-9" />
              </Link>
            </PlusGridItem>
            {banner && (
              <div className="relative hidden items-center py-3 lg:flex">
                {banner}
              </div>
            )}
          </div>
          <DesktopNav />
          <MobileNavButton />
        </PlusGridRow>
      </PlusGrid>
      <MobileNav />
    </Disclosure>
  )
}
