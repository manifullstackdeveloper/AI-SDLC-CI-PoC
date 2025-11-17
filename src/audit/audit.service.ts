import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface AuditFileInfo {
  path: string;
  lines: number;
  size: number;
  modified: string | null;
}

export interface AuditTokenCounts {
  input: number;
  output: number;
  total: number;
}

export interface AuditSession {
  id: string;
  timestamp: string;
  tool: string;
  model: string;
  tokens: AuditTokenCounts;
  files: AuditFileInfo[];
  commit: string | null;
  branch: string | null;
  userId: string;
  prompt: string | null;
}

export interface AuditSummary {
  totalSessions: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalFiles: number;
  byTool: Record<string, { sessions: number; tokens: number; files: number }>;
  byModel: Record<string, { sessions: number; tokens: number }>;
  byUser: Record<string, { sessions: number; tokens: number }>;
}

export interface AuditReport {
  sessions: AuditSession[];
  summary: AuditSummary;
}

interface RawToolSummary {
  sessions?: number | string;
  tokens?: number | string;
  files?: number | string;
}

interface RawPartialSummary {
  totalSessions?: number | string;
  totalTokens?: number | string;
  totalInputTokens?: number | string;
  totalOutputTokens?: number | string;
  totalFiles?: number | string;
  byTool?: Record<string, RawToolSummary>;
  byModel?: Record<string, Partial<{ sessions: number | string; tokens: number | string }>>;
  byUser?: Record<string, Partial<{ sessions: number | string; tokens: number | string }>>;
}

interface RawUsageData {
  sessions?: AuditSession[];
  summary?: RawPartialSummary;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly usageFilePath = join(process.cwd(), '.ai-usage', 'usage.json');

  async getAuditReport(limit?: number): Promise<AuditReport> {
    const rawData = await this.loadUsageData();
    const sessions = Array.isArray(rawData.sessions) ? [...rawData.sessions] : [];
    const limitedSessions =
      typeof limit === 'number' && limit > 0 ? sessions.slice(-limit) : sessions;

    return {
      sessions: limitedSessions,
      summary: this.normalizeSummary(rawData.summary),
    };
  }

  private async loadUsageData(): Promise<RawUsageData> {
    try {
      const contents = await fs.readFile(this.usageFilePath, 'utf-8');
      const parsed = JSON.parse(contents) as RawUsageData;
      return {
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        summary: parsed.summary,
      };
    } catch (error: unknown) {
      if (this.isMissingFileError(error)) {
        this.logger.log('Audit log not found, returning empty report');
        return { sessions: [], summary: {} };
      }

      this.logger.error('Unable to load audit data', error);
      throw new InternalServerErrorException('Failed to load audit data');
    }
  }

  private normalizeSummary(summary?: RawPartialSummary): AuditSummary {
    return {
      totalSessions: this.toNumber(summary?.totalSessions),
      totalTokens: this.toNumber(summary?.totalTokens),
      totalInputTokens: this.toNumber(summary?.totalInputTokens),
      totalOutputTokens: this.toNumber(summary?.totalOutputTokens),
      totalFiles: this.toNumber(summary?.totalFiles),
      byTool: this.normalizeToolMap(summary?.byTool),
      byModel: this.normalizePairMap(summary?.byModel),
      byUser: this.normalizePairMap(summary?.byUser),
    };
  }

  private normalizeToolMap(
    map?: Record<string, RawToolSummary>,
  ): Record<string, { sessions: number; tokens: number; files: number }> {
    const normalized: Record<string, { sessions: number; tokens: number; files: number }> = {};
    if (!map) {
      return normalized;
    }
    for (const [key, value] of Object.entries(map)) {
      normalized[key] = {
        sessions: this.toNumber(value.sessions),
        tokens: this.toNumber(value.tokens),
        files: this.toNumber(value.files),
      };
    }
    return normalized;
  }

  private normalizePairMap(
    map?: Record<string, Partial<{ sessions: number | string; tokens: number | string }>>,
  ): Record<string, { sessions: number; tokens: number }> {
    const normalized: Record<string, { sessions: number; tokens: number }> = {};
    if (!map) {
      return normalized;
    }
    for (const [key, value] of Object.entries(map)) {
      normalized[key] = {
        sessions: this.toNumber(value?.sessions),
        tokens: this.toNumber(value?.tokens),
      };
    }
    return normalized;
  }

  private toNumber(value?: number | string | null): number {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return 0;
  }

  private isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
    return (
      error instanceof Error &&
      typeof (error as NodeJS.ErrnoException).code === 'string' &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    );
  }
}
