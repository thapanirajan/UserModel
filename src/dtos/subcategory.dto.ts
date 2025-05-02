import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateSubcategoryDTO {
    @IsNotEmpty({ message: 'Name is required' })
    @IsString()
    name: string;
}

export class UpdateSubcategoryDTO {
    @IsOptional()
    @IsString()
    name?: string;

}