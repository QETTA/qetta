# QETTA Industry BLOCKs

> **Domain Engine Rebuild**: Progressive Disclosure Architecture for Token Budget Optimization

## Overview

This directory contains 12 enriched Industry BLOCKs that power QETTA's Domain Engine. Each block encapsulates industry-specific terminology, document templates, and compliance rules.

## Architecture

```
lib/skill-engine/blocks/
├── types.ts              # Type definitions
├── index.ts              # Block registry
├── automotive.ts         # Manufacturing
├── semiconductor.ts      # Manufacturing
├── electronics.ts        # Manufacturing
├── machinery.ts          # Manufacturing
├── energy.ts             # Energy/Environment
├── chemical.ts           # Energy/Environment
├── environment.ts        # Energy/Environment (extracted from TMS)
├── autonomous.ts         # Advanced Tech
├── healthcare.ts         # Advanced Tech
├── bio-pharma.ts         # Advanced Tech
├── logistics.ts          # Finance/Service
└── construction.ts       # Finance/Service
```

## Progressive Disclosure Layers

### Level 1: Metadata (~50 tokens)
```typescript
interface TermMetadata {
  id: string
  korean: string
  english: string
  category: string
}
```

### Level 2: Terminology (~500 tokens)
```typescript
interface TermMapping extends TermMetadata {
  unit?: string
  description: string
  aliases?: string[]
}
```

### Level 3: Full (~2000 tokens)
```typescript
interface TermFull extends TermMapping {
  legalLimit?: number
  regulatoryRef?: string
  validationRange?: { min: number; max: number }
  examples?: string[]
}
```

## Block Structure

Each block contains:

| Component | Min Count | Purpose |
|-----------|-----------|---------|
| **Terminology** | 5+ | Industry-specific terms with progressive detail |
| **Templates** | 2-3 | Document generation templates (HWP/DOCX/XLSX/PDF) |
| **Rules** | 2-3 | Compliance rules (error/warning/info) |

## Categories

### Manufacturing (4 blocks)
- **AUTOMOTIVE**: PPAP, APQP, IATF 16949, Cpk, SPC
- **SEMICONDUCTOR**: Wafer Yield, Critical Dimension, Cleanroom, FDC
- **ELECTRONICS**: SMT, AOI, RoHS, ESD, FPY
- **MACHINERY**: OEE, TPM, MTBF, MTTR, CNC

### Energy/Environment (3 blocks)
- **ENERGY**: Capacity Factor, REC, ESS, Demand Response
- **CHEMICAL**: PSM, MSDS, HAZOP, Batch Yield
- **ENVIRONMENT**: NOx, SOx, PM, TMS, CleanSYS (from TMS skill)

### Advanced Tech (3 blocks)
- **AUTONOMOUS**: SAE Level, ADAS, LiDAR, Sensor Fusion
- **HEALTHCARE**: GMP, MFDS, Clinical Trial, IRB, UDI
- **BIO_PHARMA**: IND, NDA, GLP, CTD, Biologics

### Finance/Service (2 blocks)
- **LOGISTICS**: OTIF, WMS, TMS, 3PL, Inventory Turnover
- **CONSTRUCTION**: PQ, KOSHA, BIM, Safety Index, CSI

## Usage

### Load All Blocks
```typescript
import { blockRegistry, ALL_BLOCK_IDS } from '@/lib/skill-engine/blocks'

const allBlocks = blockRegistry.load(ALL_BLOCK_IDS)
```

### Load Specific Blocks
```typescript
import { blockRegistry } from '@/lib/skill-engine/blocks'

const mfgBlocks = blockRegistry.load(['AUTOMOTIVE', 'SEMICONDUCTOR'])
```

### Get by Category
```typescript
const mfgBlocks = blockRegistry.getByCategory('manufacturing')
```

### Get Single Block
```typescript
const autoBlock = blockRegistry.get('AUTOMOTIVE')
if (autoBlock) {
  console.log(autoBlock.terminology) // 7 terms
  console.log(autoBlock.templates)   // 3 templates
  console.log(autoBlock.rules)       // 3 rules
}
```

## Token Budget Estimates

| Block | Metadata | Terminology | Full |
|-------|----------|-------------|------|
| Each | ~50 tokens | ~500 tokens | ~2000 tokens |
| All 12 | ~600 tokens | ~6000 tokens | ~24000 tokens |

## Quality Standards

✅ **Passed**:
- 12/12 blocks created
- All blocks have 5+ terminology entries
- All blocks have 2-3 templates
- All blocks have 2-3 rules
- TypeScript compilation: ✅ Passed
- Forbidden terms: ✅ None found (no "블록체인")

## Migration Notes

### From TMS Skill
The **ENVIRONMENT** block was extracted from `lib/skill-engine/skills/tms/index.ts`:
- Pollutants: NOx, SOx, PM, PM10, PM25, CO, O3
- Systems: TMS, CleanSYS, CEMS
- Templates: Daily Report, Monthly Report, Measurement Record
- Rules: Clean Air Act, Warning Threshold, CleanSYS Sync

## Next Steps

1. **DomainEngine Integration**: Update `lib/skill-engine/domain-engine.ts` to use `blockRegistry`
2. **Skill Migration**: Migrate existing skills (TMS, Smart Factory, AI Voucher, Global Tender) to use blocks
3. **Template Engine**: Integrate blocks with `lib/skill-engine/template-engine/`
4. **API Routes**: Expose block registry via `/api/skill-engine/blocks`

## References

- Type definitions: `types.ts`
- Registry implementation: `index.ts`
- Super Model: `generators/gov-support/data/qetta-super-model.json`
- Terminology rules: `.claude/rules/terminology.md`

---

*Last updated: 2026-01-27*
*Total lines: 2,294*
*Average per block: 163 lines*
