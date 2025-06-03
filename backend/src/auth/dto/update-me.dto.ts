import { IsOptional, IsString } from 'class-validator';

export class updateMe {
  @IsOptional()
  @IsString()
  name?: string;
}
