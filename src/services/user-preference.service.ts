/**
 * User preference service — privacy settings
 */

import { api } from "@/lib/api-client";

type ApiResponse<T> = { message: string; data: T };

export const userPreferenceService = {
  /** GET /preferences/privacy */
  getPrivacySettings: () =>
    api
      .get<ApiResponse<Record<string, string>>>("/preferences/privacy")
      .then((r) => r.data.data),

  /** PUT /preferences/privacy */
  updatePrivacySettings: (data: Record<string, string>) =>
    api
      .put<ApiResponse<Record<string, string>>>("/preferences/privacy", data)
      .then((r) => r.data),
};
