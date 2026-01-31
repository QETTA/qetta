import { PlusGrid, PlusGridItem, PlusGridRow } from '@/components/marketing/plus-grid'
import { Button } from '@/components/catalyst/button'
import { Container } from '@/components/ui/container'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/qetta-logo'
import { CTA_LABELS } from '@/constants/messages'

function CallToAction() {
  return (
    <section
      aria-labelledby="footer-cta-heading"
      className="relative pt-20 pb-16 text-center sm:py-24"
    >
      <p className="text-sm font-medium uppercase tracking-wider text-white">
        Document Automation
      </p>
      <h2
        id="footer-cta-heading"
        className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-5xl"
      >
        8 hours to 30 minutes,
        <br />
        <span className="text-white">Starting next week.</span>
      </h2>
      <p className="mx-auto mt-6 max-w-xs text-sm/6 text-zinc-400">
        From industry BLOCK setup to your first document.
        <br />
        Expert support for 30 days.
      </p>
      <div className="mt-6">
        <Button
          className="w-full bg-white px-8 py-3 text-base font-semibold text-zinc-950 hover:bg-zinc-100 border-white sm:w-auto"
          href="/pricing"
        >
          {CTA_LABELS.FREE_TRIAL}
        </Button>
      </div>
    </section>
  )
}

function SitemapHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm/6 font-medium text-zinc-400">{children}</h3>
}

function SitemapLinks({ children }: { children: React.ReactNode }) {
  return <ul className="mt-6 space-y-4 text-sm/6">{children}</ul>
}

function SitemapLink(props: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <li>
      <Link
        {...props}
        className="font-medium text-white transition-colors hover:text-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 focus-visible:rounded-sm"
      />
    </li>
  )
}

function Sitemap() {
  return (
    <>
      <div>
        <SitemapHeading>Product</SitemapHeading>
        <SitemapLinks>
          <SitemapLink href="/pricing">Pricing</SitemapLink>
          <SitemapLink href="/#product">Qetta.DOCS</SitemapLink>
          <SitemapLink href="/#product">Qetta.VERIFY</SitemapLink>
        </SitemapLinks>
      </div>
      <div>
        <SitemapHeading>Company</SitemapHeading>
        <SitemapLinks>
          <SitemapLink href="/company">About Us</SitemapLink>
          <SitemapLink href="/company">Team</SitemapLink>
          <SitemapLink href="mailto:hr@qetta.io">Careers</SitemapLink>
        </SitemapLinks>
      </div>
      <div>
        <SitemapHeading>Support</SitemapHeading>
        <SitemapLinks>
          <SitemapLink href="mailto:support@qetta.io">Help Center</SitemapLink>
          <SitemapLink href="https://docs.qetta.io">API Docs</SitemapLink>
        </SitemapLinks>
      </div>
      <div>
        <SitemapHeading>Legal</SitemapHeading>
        <SitemapLinks>
          <SitemapLink href="/company">Terms of Service</SitemapLink>
          <SitemapLink href="/company">Privacy Policy</SitemapLink>
        </SitemapLinks>
      </div>
    </>
  )
}

function SocialIconLinkedIn(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M14.82 0H1.18A1.169 1.169 0 000 1.154v13.694A1.168 1.168 0 001.18 16h13.64A1.17 1.17 0 0016 14.845V1.15A1.171 1.171 0 0014.82 0zM4.744 13.64H2.369V5.996h2.375v7.644zm-1.18-8.684a1.377 1.377 0 11.52-.106 1.377 1.377 0 01-.527.103l.007.003zm10.075 8.683h-2.375V9.921c0-.885-.015-2.025-1.234-2.025-1.218 0-1.425.966-1.425 1.968v3.775H6.233V5.997H8.51v1.05h.032c.317-.601 1.09-1.235 2.246-1.235 2.405-.005 2.851 1.578 2.851 3.63v4.197z" />
    </svg>
  )
}

function SocialLinks() {
  return (
    <>
      <Link
        href="mailto:contact@qetta.io"
        aria-label="Send email to QETTA"
        className="text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 focus-visible:rounded-sm"
      >
        <SocialIconLinkedIn className="size-4" aria-hidden="true" />
      </Link>
    </>
  )
}

function Copyright() {
  return (
    <div className="text-sm/6 text-zinc-400">
      &copy; {new Date().getFullYear()} QETTA Inc. All rights reserved.
    </div>
  )
}

export function Footer() {
  return (
    <>
      {/* CTA Section */}
      <div className="bg-zinc-900">
        <Container>
          <CallToAction />
        </Container>
      </div>

      {/* Footer - Sitemap, Copyright, Social Links */}
      <footer className="bg-zinc-950 border-t border-white/5">
        <Container>
          <PlusGrid className="pb-16 pt-8">
            <PlusGridRow>
              <div className="grid grid-cols-2 gap-y-10 pb-6 lg:grid-cols-6 lg:gap-8">
                <div className="col-span-2 flex">
                  <PlusGridItem className="pt-6 lg:pb-6">
                    <Logo className="h-9" />
                  </PlusGridItem>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-x-8 gap-y-12 lg:col-span-4 lg:grid-cols-subgrid lg:pt-6">
                  <Sitemap />
                </div>
              </div>
            </PlusGridRow>
            <PlusGridRow className="flex justify-between border-t border-white/5 pt-6">
              <div>
                <PlusGridItem className="py-3">
                  <Copyright />
                </PlusGridItem>
              </div>
              <div className="flex">
                <PlusGridItem className="flex items-center gap-8 py-3">
                  <SocialLinks />
                </PlusGridItem>
              </div>
            </PlusGridRow>
          </PlusGrid>
        </Container>
      </footer>
    </>
  )
}
