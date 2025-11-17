import { InternalServerErrorException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    service = new AuditService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns an empty report when audit file is missing', async () => {
    const enoent = new Error('missing') as NodeJS.ErrnoException;
    enoent.code = 'ENOENT';
    jest.spyOn(fs, 'readFile').mockRejectedValue(enoent);

    const report = await service.getAuditReport();

    expect(report.sessions).toHaveLength(0);
    expect(report.summary.totalSessions).toBe(0);
    expect(report.summary.byTool).toEqual({});
  });

  it('throws when the audit file cannot be parsed', async () => {
    jest.spyOn(fs, 'readFile').mockResolvedValue('not a json');

    await expect(service.getAuditReport()).rejects.toThrow(InternalServerErrorException);
  });

  it('respects the limit and returns normalized summary', async () => {
    const sample = {
      sessions: [
        {
          id: 'session-1',
          timestamp: '2025-01-01T00:00:00.000Z',
          tool: 'Cursor',
          model: 'claude-3-opus',
          tokens: { input: 10, output: 5, total: 15 },
          files: [
            { path: 'src/test.ts', lines: 10, size: 100, modified: '2025-01-01T00:00:00.000Z' },
          ],
          commit: 'abcd',
          branch: 'main',
          userId: 'developer',
          prompt: null,
        },
        {
          id: 'session-2',
          timestamp: '2025-01-02T00:00:00.000Z',
          tool: 'Cursor',
          model: 'claude-3-opus',
          tokens: { input: 20, output: 10, total: 30 },
          files: [
            { path: 'src/other.ts', lines: 20, size: 200, modified: '2025-01-02T00:00:00.000Z' },
          ],
          commit: 'efgh',
          branch: 'main',
          userId: 'developer',
          prompt: 'Prompt',
        },
      ],
      summary: {
        totalSessions: 2,
        totalTokens: 45,
        totalInputTokens: 30,
        totalOutputTokens: 15,
        totalFiles: 2,
        byTool: {
          Cursor: { sessions: 2, tokens: 45, files: 2 },
        },
        byModel: {
          'claude-3-opus': { sessions: 2, tokens: 45 },
        },
        byUser: {
          developer: { sessions: 2, tokens: 45 },
        },
      },
    };

    jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(sample));

    const report = await service.getAuditReport(1);

    expect(report.sessions).toHaveLength(1);
    expect(report.sessions[0].id).toBe('session-2');
    expect(report.summary.totalSessions).toBe(2);
    expect(report.summary.byTool.Cursor.files).toBe(2);
  });
});
