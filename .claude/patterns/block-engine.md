# Block Engine Pattern

## 3-Layer Architecture

### Layer 1: System Context (~500 tokens)
- Core system prompts
- API configuration
- Base instructions

### Layer 2: Domain Engine (~4,500 tokens)
- Industry-specific blocks (10 industries)
- Company profile (Mem0 compressed)
- Domain terminology

### Layer 3: User Context (~3,500 tokens)
- Current document context
- User preferences
- Session history

## Usage Pattern

```typescript
import { BlockEngine } from '@/lib/block-engine'

const engine = new BlockEngine({
  industry: 'ENVIRONMENT',
  companyId: 'company-123'
})

const document = await engine.generate({
  template: 'business-plan',
  sections: ['executive-summary', 'market-analysis']
})
```
