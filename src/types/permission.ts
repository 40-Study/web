/**
 * Permission-related type definitions
 */

export interface Permission {
  id: string;
  name: string;
  description?: string;
  category?: string;
  created_at?: string;
}

export interface CreatePermissionData {
  name: string;
  description: string;
  category?: string;
}
