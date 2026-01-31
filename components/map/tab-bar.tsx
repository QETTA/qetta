'use client'

import { useMapContext, Tab } from './map-provider'

interface TabItem {
  id: Tab
  label: string
  icon: React.ReactNode
  activeIcon: React.ReactNode
}

const tabs: TabItem[] = [
  {
    id: 'explore',
    label: '탐색',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 2.625C8.134 2.625 3.375 7.384 3.375 13.25C3.375 19.116 8.134 23.875 14 23.875C19.866 23.875 24.625 19.116 24.625 13.25C24.625 7.384 19.866 2.625 14 2.625Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.885 10.115L15.4 15.4L10.115 17.885L12.6 12.6L17.885 10.115Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    activeIcon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 2.625C8.134 2.625 3.375 7.384 3.375 13.25C3.375 19.116 8.134 23.875 14 23.875C19.866 23.875 24.625 19.116 24.625 13.25C24.625 7.384 19.866 2.625 14 2.625Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M17.885 10.115L15.4 15.4L10.115 17.885L12.6 12.6L17.885 10.115Z"
          fill="white"
          stroke="white"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
  {
    id: 'saved',
    label: '저장됨',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M19.833 4.083H8.167C6.877 4.083 5.833 5.127 5.833 6.417V23.917L14 19.833L22.167 23.917V6.417C22.167 5.127 21.123 4.083 19.833 4.083Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    activeIcon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M19.833 4.083H8.167C6.877 4.083 5.833 5.127 5.833 6.417V23.917L14 19.833L22.167 23.917V6.417C22.167 5.127 21.123 4.083 19.833 4.083Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
  {
    id: 'contribute',
    label: '기여',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 9.333V18.667M9.333 14H18.667"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="14"
          cy="14"
          r="10.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    ),
    activeIcon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="10.5" fill="currentColor" />
        <path
          d="M14 9.333V18.667M9.333 14H18.667"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: '프로필',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="14"
          cy="10.5"
          r="4.375"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M5.833 23.917C5.833 20.186 9.261 17.5 14 17.5C18.739 17.5 22.167 20.186 22.167 23.917"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
    activeIcon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="10.5" r="4.375" fill="currentColor" />
        <path
          d="M5.833 23.917C5.833 20.186 9.261 17.5 14 17.5C18.739 17.5 22.167 20.186 22.167 23.917"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export function TabBar() {
  const { activeTab, setActiveTab } = useMapContext()

  return (
    <nav className="map-tab-bar" role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`map-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="map-tab-icon">
              {isActive ? tab.activeIcon : tab.icon}
            </span>
            <span className="map-tab-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
