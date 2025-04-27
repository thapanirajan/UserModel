import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateSubcategoryDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsInt()
    @IsNotEmpty()
    createdBy: number; 

    @IsInt()
    @IsNotEmpty()
    categoryId: number;
}