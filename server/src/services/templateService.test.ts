// Ensure env var for tests so config load won't exit
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qetta_test';
import { describe, it, expect } from 'vitest';
import { detectPlaceholders } from './templateService.js';

describe('templateService.detectPlaceholders', () => {
  it('finds handlebars-style placeholders in xml text', async () => {
    const xml = '<w:t>{{company_name}}</w:t><w:t>{{ period }}</w:t>';
    const buf = Buffer.from(xml, 'utf-8');
    const placeholders = await detectPlaceholders(buf);
    expect(placeholders.sort()).toEqual(['company_name', 'period'].sort());
  });

  it('returns empty array when no placeholders', async () => {
    const buf = Buffer.from('plain text without tokens', 'utf-8');
    const placeholders = await detectPlaceholders(buf);
    expect(placeholders).toEqual([]);
  });
});
