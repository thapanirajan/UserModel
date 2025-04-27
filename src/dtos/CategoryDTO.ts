import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateCategoryDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsInt()
    @IsNotEmpty()
    createdBy: number; 
}