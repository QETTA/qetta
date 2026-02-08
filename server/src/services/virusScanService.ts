import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const execFileAsync = promisify(execFile);

export interface ScanResult {
  clean: boolean;
  reason?: string;
}

export async function scanBuffer(buffer: Buffer): Promise<ScanResult> {
  // Check runtime env directly so tests can toggle scanning
  const scanEnabled = (process.env.CLAMAV_SCAN_ENABLED || '').toString() === 'true';
  if (!scanEnabled) {
    logger.debug('ClamAV scanning disabled by runtime env');
    return { clean: true };
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'qetta-clam-'));
  const tmpPath = path.join(tmpDir, `upload-${Date.now()}`);
  try {
    await fs.writeFile(tmpPath, buffer);
    logger.debug({ tmpPath }, 'Running clamav scan');
    try {
      const cmd = process.env.CLAMAV_COMMAND || env.CLAMAV_COMMAND;
      const { stdout } = await execFileAsync(cmd, ['--no-summary', tmpPath]);
      // clamscan returns exit code 0 for clean, 1 for infected, 2 for error.
      // If we get here without throwing, treat stdout as clean result.
      logger.debug({ stdout }, 'ClamAV stdout');
      return { clean: true };
    } catch (err) {
      // execFile throws on non-zero exit. We inspect err.code
      const e = err as { code?: number; stdout?: unknown };
      if (e.code === 1) {
        // infected
        const stdout = e.stdout || '';
        const reason = (stdout && typeof stdout === 'string') ? stdout : String(stdout || 'infected');
        logger.warn({ reason }, 'ClamAV detected infected file');
        return { clean: false, reason: reason || 'infected' };
      }
      logger.error({ err }, 'ClamAV scan failed');
      // On unknown errors, fail-open for now but log
      return { clean: true, reason: 'scan_failed' };
    }
  } finally {
    try {
      await fs.unlink(tmpPath);
      await fs.rmdir(tmpDir);
    } catch {
      // ignore cleanup errors
    }
  }
}
