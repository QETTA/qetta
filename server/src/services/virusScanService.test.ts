import { describe, it, expect, vi } from 'vitest';
import { scanBuffer } from './virusScanService.js';

// Enable ClamAV mock and provide a mockable execFile implementation with toggle
process.env.CLAMAV_SCAN_ENABLED = 'true';
vi.mock('child_process', () => ({
  execFile: (cmd: string, args: string[], cb: (err: unknown, stdout: string) => void) => {
    if (typeof cmd === 'string' && cmd.includes('infected')) return cb({ code: 1, stdout: 'FOUND' }, 'FOUND');
    if (typeof cmd === 'string' && cmd.includes('error')) return cb({ code: 2, stdout: 'ERR' }, 'ERR');
    return cb(null, 'OK');
  },
}));
describe('virusScanService.scanBuffer', () => {
  it('returns clean when clamscan returns 0', async () => {
    const buf = Buffer.from('hello');
    // ensure clean mode
    // ensure CLAMAV command is normal
    process.env.CLAMAV_COMMAND = 'clamscan';
    const res = await scanBuffer(buf);
    expect(res.clean).toBeTruthy();
  });

  it('returns infected when clamscan exit code 1', async () => {
    // simulate infected by setting command name the mock checks
    process.env.CLAMAV_COMMAND = 'clamscan-infected';
    const res = await scanBuffer(Buffer.from('infected'));
    expect(res.clean).toBeFalsy();
    expect(res.reason).toContain('FOUND');
  });
});
