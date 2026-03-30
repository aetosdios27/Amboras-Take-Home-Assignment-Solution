import { IsString, IsOptional, IsIn } from 'class-validator';

export class IngestEventDto {
  @IsString()
  @IsIn([
    'page_view',
    'add_to_cart',
    'remove_from_cart',
    'checkout_started',
    'purchase',
  ])
  eventType: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
