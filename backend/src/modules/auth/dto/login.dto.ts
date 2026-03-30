import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  userId: string;

  @IsString()
  storeId: string;
}
