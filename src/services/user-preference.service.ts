/**
 * User preference service — privacy settings
 */

import { api } from "@/lib/api-client";

type ApiResponse<T> = { message: string; data: T };

/**
 * Cài đặt riêng tư. Tên khoá do BACKEND quyết định (dto.PrivacySettingsResponseDTO / UpdatePrivacySettingsDTO):
 * gửi khoá lạ thì backend bỏ qua im lặng và lựa chọn không được lưu (từng xảy ra với `leaderboard_visibility`).
 */
export interface PrivacySettings {
  profile_visibility: string;
  activity_status: string;
  leaderboard_display: string;
}

export type PrivacySettingKey = keyof PrivacySettings;

export const userPreferenceService = {
  /** GET /preferences/privacy */
  getPrivacySettings: () =>
    api
      .get<ApiResponse<PrivacySettings>>("/preferences/privacy")
      .then((r) => r.data.data),

  /** PUT /preferences/privacy */
  updatePrivacySettings: (data: Partial<PrivacySettings>) =>
    api
      .put<ApiResponse<PrivacySettings>>("/preferences/privacy", data)
      .then((r) => r.data),
};
