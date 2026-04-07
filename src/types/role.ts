/**
 * Role-related type definitions
 */

export interface Role {
  id: string;
  name: string;
  description?: string;
  organization_id?: string;
  permissions?: string[];
  user_count?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  organization_id?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
}

export interface SystemRole {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  user_count?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}
