export interface ICreateCategoryRequest {
    name: string;
}

export interface IUpdateCategoryRequest {
    name?: string;
}

export interface ICategoryIdParams {
    id: number;
}