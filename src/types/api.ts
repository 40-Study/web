/**
 * API type definitions
 */

export interface ApiError {
    message: string;
    statusCode: number;
    errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
    data: T;
    error: ApiError | null;
}

export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
}

export interface ApiErrorResponse {
    success: false;
    error: ApiError;
}

export type ApiResult<T> = ApiSuccessResponse<T> | ApiErrorResponse;
