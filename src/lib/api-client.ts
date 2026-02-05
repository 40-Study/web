import { ApiError, ApiResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface RequestConfig extends RequestInit {
    params?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        config: RequestConfig = {}
    ): Promise<ApiResponse<T>> {
        const { params, ...init } = config;

        let url = `${this.baseUrl}${endpoint}`;
        if (params) {
            const searchParams = new URLSearchParams(params);
            url += `?${searchParams.toString()}`;
        }

        const headers: HeadersInit = {
            "Content-Type": "application/json",
            ...init.headers,
        };

        try {
            const response = await fetch(url, {
                ...init,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                const error: ApiError = {
                    message: data.message || "Có lỗi xảy ra",
                    statusCode: response.status,
                };
                return { data: null as T, error };
            }

            return { data, error: null };
        } catch (error) {
            return {
                data: null as T,
                error: {
                    message: error instanceof Error ? error.message : "Network error",
                    statusCode: 0,
                },
            };
        }
    }

    async get<T>(endpoint: string, config?: RequestConfig) {
        return this.request<T>(endpoint, { ...config, method: "GET" });
    }

    async post<T>(endpoint: string, body?: unknown, config?: RequestConfig) {
        return this.request<T>(endpoint, {
            ...config,
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async put<T>(endpoint: string, body?: unknown, config?: RequestConfig) {
        return this.request<T>(endpoint, {
            ...config,
            method: "PUT",
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async patch<T>(endpoint: string, body?: unknown, config?: RequestConfig) {
        return this.request<T>(endpoint, {
            ...config,
            method: "PATCH",
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete<T>(endpoint: string, config?: RequestConfig) {
        return this.request<T>(endpoint, { ...config, method: "DELETE" });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
