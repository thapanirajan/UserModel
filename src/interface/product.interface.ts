export interface ICreateProductRequest {
    name: string;
    description: string;
    price: number;
    stock: number;
}

export interface IUpdateProductRequest {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
}

export interface IProductIdParams {
    categoryId: number;
    subcategoryId: number;
    id: number;
}