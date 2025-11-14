import { Test, TestingModule } from '@nestjs/testing';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

describe('ItemsController', () => {
  let controller: ItemsController;
  let service: ItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [ItemsService],
    }).compile();

    controller = module.get<ItemsController>(ItemsController);
    service = module.get<ItemsService>(ItemsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an item', () => {
      const createItemDto = { name: 'Test', description: 'Test' };
      const result = controller.create(createItemDto);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createItemDto.name);
    });
  });

  describe('findAll', () => {
    it('should return an array', () => {
      const result = controller.findAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

