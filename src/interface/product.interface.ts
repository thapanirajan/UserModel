import { CreateProductInput, UpdateProductInput } from "../utils/zod_validations/product.zod";

export interface ICreateProductRequest extends CreateProductInput { } // from zod validation 


export interface IUpdateProductRequest extends UpdateProductInput { } // from zod validation 

export interface IProductIdParams {
    categoryId: number;
    subcategoryId: number;
    id: number;
}

export interface IProductImageParams extends IProductIdParams {
    imageUrl: string;
}