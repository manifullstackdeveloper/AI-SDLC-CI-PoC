import { Module } from '@nestjs/common';
import { AuditController } from './audit/audit.controller';
import { AuditService } from './audit/audit.service';
import { ItemsController } from './items/items.controller';
import { ItemsService } from './items/items.service';

@Module({
  imports: [],
  controllers: [ItemsController, AuditController],
  providers: [ItemsService, AuditService],
})
export class AppModule {}
