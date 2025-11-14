import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService, Item } from './items.service';
import { NotFoundException } from '@nestjs/common';

describe('ItemsService', () => {
  let service: ItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemsService],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an item', () => {
      const createItemDto = { name: 'Test Item', description: 'Test Description' };
      const item = service.create(createItemDto);
      expect(item).toHaveProperty('id');
      expect(item.name).toBe(createItemDto.name);
      expect(item.description).toBe(createItemDto.description);
    });
  });

  describe('findAll', () => {
    it('should return an array of items', () => {
      service.create({ name: 'Item 1', description: 'Desc 1' });
      service.create({ name: 'Item 2', description: 'Desc 2' });
      const items = service.findAll();
      expect(items.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('findOne', () => {
    it('should return an item by id', () => {
      const created = service.create({ name: 'Test', description: 'Test' });
      const found = service.findOne(created.id);
      expect(found.id).toBe(created.id);
    });

    it('should throw NotFoundException if item not found', () => {
      expect(() => service.findOne('999')).toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an item', () => {
      const created = service.create({ name: 'Test', description: 'Test' });
      const updated = service.update(created.id, { name: 'Updated' });
      expect(updated.name).toBe('Updated');
    });

    it('should throw NotFoundException if item not found', () => {
      expect(() => service.update('999', { name: 'Updated' })).toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an item', () => {
      const created = service.create({ name: 'Test', description: 'Test' });
      service.remove(created.id);
      expect(() => service.findOne(created.id)).toThrow(NotFoundException);
    });

    it('should throw NotFoundException if item not found', () => {
      expect(() => service.remove('999')).toThrow(NotFoundException);
    });
  });
});

