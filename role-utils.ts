export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type RoleType = typeof UserRole[keyof typeof UserRole];


const LEGACY_ROLE_MAP: Record<string, RoleType> = {
  'Administrator': UserRole.SUPER_ADMIN,
  'Admin': UserRole.ADMIN,
  'User': UserRole.USER,
  'administrator': UserRole.SUPER_ADMIN,
  'ADMIN': UserRole.ADMIN,
  'USER': UserRole.USER,
  'admin': UserRole.ADMIN,
  'user': UserRole.USER,
  'super_admin': UserRole.SUPER_ADMIN,
};

export function normalizeRole(role: string | undefined | null): RoleType {
  if (!role) return UserRole.USER;
  
  if (Object.values(UserRole).includes(role as RoleType)) {
    return role as RoleType;
  }

  return LEGACY_ROLE_MAP[role] ?? UserRole.USER;
}

export function isAdmin(role: string | undefined | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === UserRole.SUPER_ADMIN || normalized === UserRole.ADMIN;
}

export function isSuperAdmin(role: string | undefined | null): boolean {
  return normalizeRole(role) === UserRole.SUPER_ADMIN;
}

export function getRoleLabel(role: string | undefined | null): string {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case UserRole.SUPER_ADMIN:
      return 'Super Admin';
    case UserRole.ADMIN:
      return 'Admin';
    case UserRole.USER:
    default:
      return 'User';
  }
}

export const ROLE_LEVEL: Record<RoleType, number> = {
  [UserRole.USER]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
};

/**
 * Check if roleA can manage roleB
 * @param managerRole The role of the person trying to manage
 * @param targetRole The role of the person being managed
 * @returns true if managerRole can manage targetRole
 */
export function canManageRole(
  managerRole: string | undefined | null,
  targetRole: string | undefined | null
): boolean {
  const managerLevel = ROLE_LEVEL[normalizeRole(managerRole)];
  const targetLevel = ROLE_LEVEL[normalizeRole(targetRole)];

  if (normalizeRole(managerRole) === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  return managerLevel > targetLevel;
}

/**
 * Get available roles that a manager can assign
 * @param managerRole The role of the person assigning roles
 * @returns Array of roles that can be assigned
 */
export function getAssignableRoles(managerRole: string | undefined | null): RoleType[] {
  const normalized = normalizeRole(managerRole);
  
  switch (normalized) {
    case UserRole.SUPER_ADMIN:
      // Super admin can assign any role
      return [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
    case UserRole.ADMIN:
      // Admin can only assign user role
      return [UserRole.USER];
    default:
      // Regular users cannot assign roles
      return [];
  }
}

export interface RoleDisplayConfig {
  value: RoleType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const ROLE_DISPLAY_CONFIG: Record<RoleType, RoleDisplayConfig> = {
  [UserRole.SUPER_ADMIN]: {
    value: UserRole.SUPER_ADMIN,
    label: 'Super Admin',
    description: 'Full system access, can manage all users including other admins',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  [UserRole.ADMIN]: {
    value: UserRole.ADMIN,
    label: 'Admin',
    description: 'Can manage regular users and content',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  [UserRole.USER]: {
    value: UserRole.USER,
    label: 'User',
    description: 'Regular user with standard access',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
};

export function migrateRole(oldRole: string): RoleType {
  return normalizeRole(oldRole);
}

// ===========================================
// Type exports for TypeScript consumers
// ===========================================

export interface RoleBasedPermissions {
  canViewAllUsers: boolean;
  canViewAdminUsers: boolean;
  canCreateAdminUsers: boolean;
  canDeleteAdminUsers: boolean;
  canModifyAdminUsers: boolean;
  canAccessAdminPanel: boolean;
}

/**
 * Get all permissions for a given role
 */
export function getPermissions(role: string | undefined | null): RoleBasedPermissions {
  const normalized = normalizeRole(role);
  
  switch (normalized) {
    case UserRole.SUPER_ADMIN:
      return {
        canViewAllUsers: true,
        canViewAdminUsers: true,
        canCreateAdminUsers: true,
        canDeleteAdminUsers: true,
        canModifyAdminUsers: true,
        canAccessAdminPanel: true,
      };
    case UserRole.ADMIN:
      return {
        canViewAllUsers: false, 
        canViewAdminUsers: false,
        canCreateAdminUsers: false,
        canDeleteAdminUsers: false,
        canModifyAdminUsers: false,
        canAccessAdminPanel: true,
      };
    default:
      return {
        canViewAllUsers: false,
        canViewAdminUsers: false,
        canCreateAdminUsers: false,
        canDeleteAdminUsers: false,
        canModifyAdminUsers: false,
        canAccessAdminPanel: false,
      };
  }
}
