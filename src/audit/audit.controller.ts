import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditReport, AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getAudit(@Query() query: AuditQueryDto): Promise<AuditReport> {
    return this.auditService.getAuditReport(query.limit);
  }
}
