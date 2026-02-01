import type { Metadata } from 'next'
import { Container } from '@/components/ui/container'

export const metadata: Metadata = {
  title: '이용약관',
  description: 'QETTA 서비스 이용약관',
}

export default function TermsPage() {
  return (
    <main className="overflow-hidden">
      <Container className="mt-16 mb-24">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100">이용약관</h1>
        <p className="mt-2 text-sm text-zinc-400">최종 업데이트: 2025년 1월 1일</p>

        <div className="mt-10 max-w-3xl space-y-8 text-sm/7 text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-zinc-100">제1조 (목적)</h2>
            <p className="mt-3">
              본 약관은 QETTA Inc.(이하 &quot;회사&quot;)가 제공하는 AI 문서 자동화 플랫폼
              서비스(이하 &quot;서비스&quot;)의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및
              책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">제2조 (정의)</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                &quot;서비스&quot;란 회사가 제공하는 AI 기반 문서 작성, 분석, 자동화 관련 일체의
                서비스를 말합니다.
              </li>
              <li>
                &quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.
              </li>
              <li>
                &quot;계정&quot;이란 이용자의 식별과 서비스 이용을 위해 이용자가 설정한 이메일 및
                비밀번호의 조합을 말합니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">제3조 (서비스 이용)</h2>
            <p className="mt-3">
              서비스는 회원가입 후 이용 가능하며, 일부 기능은 유료 결제가 필요할 수 있습니다. 회사는
              서비스의 안정적 운영을 위해 사전 공지 후 서비스 내용을 변경할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">제4조 (개인정보 보호)</h2>
            <p className="mt-3">
              회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다.
              개인정보의 보호 및 사용에 대해서는 관련 법령 및 회사의 개인정보처리방침에 따릅니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">제5조 (면책 조항)</h2>
            <p className="mt-3">
              AI가 생성한 문서 및 분석 결과는 참고용이며, 최종 판단 및 책임은 이용자에게 있습니다.
              회사는 천재지변, 불가항력 등으로 인한 서비스 중단에 대해 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">제6조 (분쟁 해결)</h2>
            <p className="mt-3">
              본 약관에 관한 분쟁은 대한민국 법률에 따라 해결하며, 관할 법원은 회사 소재지의
              법원으로 합니다.
            </p>
          </section>

          <div className="mt-12 rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
            <p className="text-zinc-400">
              문의사항이 있으시면{' '}
              <a
                href="mailto:support@qetta.io"
                className="text-white underline hover:text-zinc-300"
              >
                support@qetta.io
              </a>
              로 연락해 주세요.
            </p>
          </div>
        </div>
      </Container>
    </main>
  )
}
