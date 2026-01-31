import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface PasswordResetEmailProps {
  resetUrl: string
  email: string
}

/**
 * 비밀번호 재설정 템플릿
 *
 * QETTA 비밀번호 재설정 요청 시 발송되는 이메일
 */
export default function PasswordResetEmail({
  resetUrl,
  email,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>QETTA 비밀번호를 재설정하세요</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* 로고 */}
          <Section style={logoSection}>
            <div style={logo}>Q</div>
            <Text style={brandName}>QETTA</Text>
          </Section>

          {/* 제목 */}
          <Heading style={heading}>비밀번호 재설정</Heading>

          {/* 내용 */}
          <Text style={text}>
            안녕하세요!
          </Text>
          <Text style={text}>
            <strong>{email}</strong> 계정의 비밀번호 재설정을 요청하셨습니다.
          </Text>
          <Text style={text}>
            아래 버튼을 클릭하여 새 비밀번호를 설정해주세요:
          </Text>

          {/* 재설정 버튼 */}
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              비밀번호 재설정하기
            </Button>
          </Section>

          {/* 보안 안내 */}
          <Section style={warningBox}>
            <Text style={warningText}>
              ⚠️ <strong>보안 안내</strong>
            </Text>
            <Text style={warningText}>
              이 링크는 1시간 동안만 유효합니다.
              <br />
              비밀번호 재설정을 요청하지 않았다면 이 이메일을 무시해주세요.
            </Text>
          </Section>

          {/* 링크 복사 안내 */}
          <Text style={smallText}>
            버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:
          </Text>
          <Link href={resetUrl} style={link}>
            {resetUrl}
          </Link>

          {/* 푸터 */}
          <Text style={footer}>
            이 이메일을 요청하지 않았다면 무시해주세요.
            <br />
            비밀번호는 변경되지 않습니다.
          </Text>
          <Text style={footer}>
            © 2026 QETTA Inc. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// 스타일 정의
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
}

const logoSection = {
  textAlign: 'center' as const,
  padding: '32px 0 24px',
}

const logo = {
  display: 'inline-block',
  width: '48px',
  height: '48px',
  backgroundColor: '#7c3aed',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  lineHeight: '48px',
  textAlign: 'center' as const,
  marginBottom: '8px',
}

const brandName = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0',
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 24px',
  padding: '0 48px',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
  padding: '0 48px',
}

const buttonContainer = {
  padding: '24px 48px',
}

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px 24px',
}

const warningBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  margin: '24px 48px',
  padding: '16px',
}

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
}

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0 8px',
  padding: '0 48px',
}

const link = {
  color: '#7c3aed',
  fontSize: '14px',
  lineHeight: '20px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  padding: '0 48px',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '24px 0 0',
  padding: '0 48px',
  textAlign: 'center' as const,
}
