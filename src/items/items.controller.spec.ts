import { Test, TestingModule } from '@nestjs/testing';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

describe('ItemsController', () => {
  let controller: ItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [ItemsService],
    }).compile();

    controller = module.get<ItemsController>(ItemsController);
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

  describe('findOne', () => {
    it('should return an item by id', () => {
      const created = controller.create({ name: 'Test', description: 'Test' });
      const result = controller.findOne(created.id);
      expect(result.id).toBe(created.id);
      expect(result.name).toBe('Test');
    });
  });

  describe('update', () => {
    it('should update an item', () => {
      const created = controller.create({ name: 'Test', description: 'Test' });
      const result = controller.update(created.id, { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should remove an item', () => {
      const created = controller.create({ name: 'Test', description: 'Test' });
      controller.remove(created.id);
      expect(() => controller.findOne(created.id)).toThrow();
    });
  });
});
