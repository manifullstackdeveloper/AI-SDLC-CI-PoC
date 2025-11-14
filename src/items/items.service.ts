import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

export interface Item {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);
  private items: Item[] = [];
  private idCounter = 1;

  create(createItemDto: CreateItemDto): Item {
    this.logger.log(`Creating item: ${createItemDto.name}`);
    const item: Item = {
      id: String(this.idCounter++),
      ...createItemDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(item);
    return item;
  }

  findAll(): Item[] {
    this.logger.log('Finding all items');
    return this.items;
  }

  findOne(id: string): Item {
    this.logger.log(`Finding item with id: ${id}`);
    const item = this.items.find((item) => item.id === id);
    if (!item) {
      this.logger.warn(`Item not found: ${id}`);
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  update(id: string, updateItemDto: UpdateItemDto): Item {
    this.logger.log(`Updating item with id: ${id}`);
    const itemIndex = this.items.findIndex((item) => item.id === id);
    if (itemIndex === -1) {
      this.logger.warn(`Item not found for update: ${id}`);
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    this.items[itemIndex] = {
      ...this.items[itemIndex],
      ...updateItemDto,
      updatedAt: new Date(),
    };
    return this.items[itemIndex];
  }

  remove(id: string): void {
    this.logger.log(`Removing item with id: ${id}`);
    const itemIndex = this.items.findIndex((item) => item.id === id);
    if (itemIndex === -1) {
      this.logger.warn(`Item not found for deletion: ${id}`);
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    this.items.splice(itemIndex, 1);
  }
}

