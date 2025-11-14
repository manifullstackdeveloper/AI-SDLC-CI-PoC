import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateItemDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(500)
  description?: string;
}

