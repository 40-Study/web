import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, PaginationParams } from "@/types";

/**
 * Base service class for API operations
 * Note: apiClient now returns data directly (not wrapped in ApiResponse)
 */
export abstract class BaseService<T> {
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async getAll(params?: PaginationParams): Promise<PaginatedResponse<T>> {
    return apiClient.get<PaginatedResponse<T>>(this.endpoint, {
      params: params as Record<string, string>,
    });
  }

  async getById(id: string | number): Promise<T> {
    return apiClient.get<T>(`${this.endpoint}/${id}`);
  }

  async create(data: Partial<T>): Promise<T> {
    return apiClient.post<T>(this.endpoint, data);
  }

  async update(id: string | number, data: Partial<T>): Promise<T> {
    return apiClient.put<T>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string | number): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }
}
