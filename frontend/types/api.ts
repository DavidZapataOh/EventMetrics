export interface ApiResponse<T> {
    data: T;
    message?: string;
}
  
export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}
  
export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
  
export interface QueryParams {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    filter?: Record<string, any>;
}