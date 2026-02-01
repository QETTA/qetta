import type { Metadata } from 'next'
import { Container } from '@/components/ui/container'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'QETTA 개인정보처리방침',
}

export default function PrivacyPage() {
  return (
    <main className="overflow-hidden">
      <Container className="mt-16 mb-24">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-zinc-400">최종 업데이트: 2025년 1월 1일</p>

        <div className="mt-10 max-w-3xl space-y-8 text-sm/7 text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-zinc-100">1. 수집하는 개인정보</h2>
            <p className="mt-3">회사는 서비스 제공을 위해 다음 정보를 수집합니다:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>필수 정보:</strong> 이메일 주소, 비밀번호 (암호화 저장), 이름
              </li>
              <li>
                <strong>자동 수집:</strong> 접속 IP, 브라우저 정보, 서비스 이용 기록
              </li>
              <li>
                <strong>선택 정보:</strong> 프로필 이미지, 소속 기관
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">2. 개인정보의 이용 목적</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>서비스 제공 및 계정 관리</li>
              <li>AI 문서 자동화 기능 제공</li>
              <li>서비스 개선 및 통계 분석</li>
              <li>고객 문의 응대 및 공지사항 전달</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">3. 개인정보의 보유 및 파기</h2>
            <p className="mt-3">
              회원 탈퇴 시 개인정보를 지체 없이 파기합니다. 다만, 관련 법령에 의해 보존이 필요한
              경우 해당 기간 동안 보관 후 파기합니다.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>전자상거래 기록: 5년 (전자상거래법)</li>
              <li>접속 로그: 3개월 (통신비밀보호법)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">4. 개인정보의 제3자 제공</h2>
            <p className="mt-3">
              회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의한
              요청이 있는 경우 예외로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">5. 개인정보 보호 조치</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>비밀번호 bcrypt 암호화 저장</li>
              <li>HTTPS 통신 암호화</li>
              <li>접근 권한 최소화 및 감사 로그 기록</li>
              <li>정기적 보안 점검</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">6. 이용자의 권리</h2>
            <p className="mt-3">
              이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있으며, 계정 설정 페이지에서
              직접 처리하거나 고객센터를 통해 요청할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">7. 쿠키 사용</h2>
            <p className="mt-3">
              서비스는 인증 세션 관리 및 사용자 환경 설정을 위해 쿠키를 사용합니다. 브라우저
              설정에서 쿠키를 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.
            </p>
          </section>

          <div className="mt-12 rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
            <p className="text-zinc-400">
              개인정보 관련 문의:{' '}
              <a
                href="mailto:privacy@qetta.io"
                className="text-white underline hover:text-zinc-300"
              >
                privacy@qetta.io
              </a>
            </p>
          </div>
        </div>
      </Container>
    </main>
  )
}
