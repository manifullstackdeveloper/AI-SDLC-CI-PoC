import { AuditController } from './audit.controller';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditReport, AuditService } from './audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  beforeEach(() => {
    service = { getAuditReport: jest.fn() } as unknown as AuditService;
    controller = new AuditController(service);
  });

  it('returns the report provided by the service', async () => {
    const mockReport: AuditReport = {
      sessions: [],
      summary: {
        totalSessions: 0,
        totalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalFiles: 0,
        byTool: {},
        byModel: {},
        byUser: {},
      },
    };

    (service.getAuditReport as jest.Mock).mockResolvedValue(mockReport);

    const query = new AuditQueryDto();
    query.limit = 5;

    await expect(controller.getAudit(query)).resolves.toBe(mockReport);
    expect(service.getAuditReport).toHaveBeenCalledWith(5);
  });
});
