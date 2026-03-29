import { IsOptional, IsString } from 'class-validator';

export class TopProductsQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
