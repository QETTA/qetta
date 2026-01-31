import { redirect } from 'next/navigation'

/**
 * Redirect /partners root to /partners/suppliers
 *
 * Partner page structure:
 * - /partners/suppliers - Supply companies (DOCS customers)
 * - /partners/buyers - Demand companies (VERIFY customers)
 * - /partners/consultants - Consultants (B2B2B partners)
 */
export default function PartnersPage() {
  redirect('/partners/suppliers')
}
