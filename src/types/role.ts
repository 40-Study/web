/**
 * Role-related type definitions
 */

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  user_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: string[];
  organization_id?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface SystemRole extends Role {
  is_system?: boolean;
}
