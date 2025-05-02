
export interface ICreateSubcategoryRequest {
    name: string;
}

export interface IUpdateSubcategoryRequest {
    name?: string;
}

export interface ISubcategoryIdParams {
    categoryId: number;
    id: number;
}