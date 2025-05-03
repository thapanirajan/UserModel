import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateProductDTO {
    @IsNotEmpty({ message: "Name is required" })
    @IsString()
    name: string;

    @IsNotEmpty({ message: "description is required" })
    @IsString()
    description: string;

    @IsNotEmpty({ message: "price is required" })
    @IsNumber({}, { message: 'Price must be a number' })
    @Min(0.01, { message: 'Price must be positive' })
    price: number;

    @IsNotEmpty({ message: 'Stock is required' })
    @IsInt({ message: 'Stock must be an integer' })
    @Min(0, { message: 'Stock cannot be negative' })
    stock: number;
}

export class UpdateProductDTO {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber({}, { message: 'Price must be a number' })
    @Min(0.01, { message: 'Price must be positive' })
    price?: number;

    @IsOptional()
    @IsInt({ message: 'Stock must be an integer' })
    @Min(0, { message: 'Stock cannot be negative' })
    stock?: number;
}