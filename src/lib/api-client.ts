import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { ApiError, ApiResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

axiosInstance.interceptors.request.use((config) => {
    // Add auth token if available
    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

class ApiClient {
    private instance: AxiosInstance;

    constructor(instance: AxiosInstance) {
        this.instance = instance;
    }

    private async request<T>(
        config: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.instance.request<T>(config);
            return { data: response.data, error: null };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const apiError: ApiError = {
                    message:
                        error.response?.data?.message || error.message || "Có lỗi xảy ra",
                    statusCode: error.response?.status || 0,
                    errors: error.response?.data?.errors,
                };
                return { data: null as T, error: apiError };
            }
            return {
                data: null as T,
                error: {
                    message: error instanceof Error ? error.message : "Network error",
                    statusCode: 0,
                },
            };
        }
    }

    async get<T>(
        endpoint: string,
        config?: { params?: Record<string, string> }
    ) {
        return this.request<T>({ url: endpoint, method: "GET", ...config });
    }

    async post<T>(
        endpoint: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ) {
        return this.request<T>({ url: endpoint, method: "POST", data, ...config });
    }

    async put<T>(
        endpoint: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ) {
        return this.request<T>({ url: endpoint, method: "PUT", data, ...config });
    }

    async patch<T>(
        endpoint: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ) {
        return this.request<T>({
            url: endpoint,
            method: "PATCH",
            data,
            ...config,
        });
    }

    async delete<T>(endpoint: string, config?: AxiosRequestConfig) {
        return this.request<T>({
            url: endpoint,
            method: "DELETE",
            ...config,
        });
    }
}

export { axiosInstance };
export const apiClient = new ApiClient(axiosInstance);
