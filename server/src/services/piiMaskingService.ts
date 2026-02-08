import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { getDb } from '../config/mongodb.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import type { PiiProcessingLog } from '../types/settlement.js';

/**
 * S2. PII 자동 탐지 & 마스킹 (C-0 필수)
 * 모든 데이터 처리 전 PII 탐지 → 마스킹 → 원본 암호화 분리 저장
 */

// 한국 PII 정규식 패턴
const PII_PATTERNS = {
  rrn: /\d{6}[-\s]?[1-4]\d{6}/g, // 주민번호
  bank_account: /\d{3,4}[-\s]?\d{2,6}[-\s]?\d{2,6}[-\s]?\d{0,3}/g, // 계좌번호
  phone: /01[016789][-\s]?\d{3,4}[-\s]?\d{4}/g, // 휴대폰
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // 이메일
} as const;

type PiiType = keyof typeof PII_PATTERNS;

interface PiiDetection {
  type: PiiType;
  value: string;
  start: number;
  end: number;
}

export function detectPii(text: string): PiiDetection[] {
  const detections: PiiDetection[] = [];

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      detections.push({
        type: type as PiiType,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return detections;
}

export function maskText(text: string): { masked: string; detections: PiiDetection[] } {
  const detections = detectPii(text);

  let masked = text;
  // 뒤에서부터 치환해야 인덱스가 밀리지 않음
  const sorted = [...detections].sort((a, b) => b.start - a.start);
  for (const d of sorted) {
    const replacement = `[${d.type.toUpperCase()}_MASKED]`;
    masked = masked.slice(0, d.start) + replacement + masked.slice(d.end);
  }

  return { masked, detections };
}

export function encryptOriginal(plaintext: string): { encrypted: string; iv: string } {
  const key = env.PII_ENCRYPTION_KEY;
  if (!key) throw new Error('PII_ENCRYPTION_KEY is not set');

  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return { encrypted, iv: iv.toString('hex') };
}

export function decryptOriginal(encrypted: string, ivHex: string): string {
  const key = env.PII_ENCRYPTION_KEY;
  if (!key) throw new Error('PII_ENCRYPTION_KEY is not set');

  const decipher = createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.from(ivHex, 'hex'),
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function logPiiProcessing(
  documentId: string,
  firmId: string,
  detections: PiiDetection[],
): Promise<void> {
  const db = getDb();
  const log: Omit<PiiProcessingLog, '_id'> = {
    document_id: new (await import('mongodb')).ObjectId(documentId),
    firm_id: firmId,
    pii_types_found: [...new Set(detections.map((d) => d.type))],
    masked_count: detections.length,
    processed_at: new Date(),
  };

  await db.collection('pii_processing_logs').insertOne(log);
  logger.info({ documentId, masked_count: detections.length }, 'PII processing logged');
}
