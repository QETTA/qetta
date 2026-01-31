import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Widget System Demo - QETTA',
  description:
    'Phase 1 Demo: Drag-and-drop widgets, resize, layout persistence. QETTA dashboard customization.',
}

export default function WidgetsDemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
