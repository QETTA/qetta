# Security Policy

## Supported Versions

현재 보안 업데이트가 지원되는 버전:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

보안 취약점을 발견하셨다면:

1. **공개 이슈로 보고하지 마세요** - 보안 취약점은 민감한 정보입니다.

2. **이메일로 연락해주세요**: security@qetta.ai

3. **포함해야 할 정보**:
   - 취약점의 상세 설명
   - 재현 단계
   - 가능한 영향 범위
   - (선택) 제안하는 수정 방법

4. **응답 시간**:
   - 48시간 이내 초기 응답
   - 7일 이내 상세 평가 완료
   - 30일 이내 수정 배포 (심각도에 따라 조정)

5. **보상**:
   - 유효한 보안 취약점 제보에 대해 Hall of Fame 등재
   - 심각한 취약점의 경우 추가 보상 협의 가능

## Security Best Practices

이 프로젝트는 다음 보안 관행을 따릅니다:

- ✅ 모든 의존성 정기적 업데이트 (Dependabot)
- ✅ CodeQL 정적 분석
- ✅ npm audit 자동 실행
- ✅ 환경변수를 통한 시크릿 관리
- ✅ HTTPS 강제 적용
- ✅ CSP (Content Security Policy) 헤더 설정

## Security Headers

프로덕션 환경에서 적용되는 보안 헤더:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```
