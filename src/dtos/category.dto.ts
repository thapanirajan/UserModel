import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateCategoryDTO {
    @IsNotEmpty({ message: 'Name is required' })
    @IsString()
    name: string;
}

export class UpdateCategoryDTO {
    @IsOptional()
    @IsString()
    name?: string;
}

