import path from 'node:path';

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.xlsx', '.docx', '.hwp', '.csv', '.jpg', '.png']);

const MAGIC_BYTES: Record<string, Buffer> = {
  '.pdf': Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
  '.xlsx': Buffer.from([0x50, 0x4b, 0x03, 0x04]), // PK zip
  '.docx': Buffer.from([0x50, 0x4b, 0x03, 0x04]), // PK zip
  '.hwp': Buffer.from([0xd0, 0xcf, 0x11, 0xe0]), // OLE2
};

export function validateFile(file: Express.Multer.File): boolean {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  const magic = MAGIC_BYTES[ext];
  if (magic && !file.buffer.subarray(0, magic.length).equals(magic)) return false;
  return true;
}
