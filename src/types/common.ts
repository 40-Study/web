/**
 * Common type definitions
 */

export type ID = string | number;

export interface BaseEntity {
    id: ID;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface User extends BaseEntity {
    email: string;
    name: string;
    avatar?: string;
    role: "user" | "admin";
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export type Status = "idle" | "loading" | "success" | "error";
