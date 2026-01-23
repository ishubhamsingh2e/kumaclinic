export const PERMISSIONS = {
  // Patient
  PATIENT_READ: "patient:read",
  PATIENT_CREATE: "patient:create",
  PATIENT_UPDATE: "patient:update",
  PATIENT_DELETE: "patient:delete",

  // Appointment
  APPOINTMENT_READ: "appointment:read",
  APPOINTMENT_CREATE: "appointment:create",
  APPOINTMENT_UPDATE: "appointment:update",
  APPOINTMENT_DELETE: "appointment:delete",

  // User
  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // Role
  ROLE_READ: "role:read",
  ROLE_CREATE: "role:create",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",

  // Dashboard
  DASHBOARD_READ: "dashboard:read",

  // Clinic
  CLINIC_UPDATE: "clinic:update",

  // Team
  TEAM_READ: "team:read",
  TEAM_INVITE: "team:invite",
  TEAM_MANAGE: "team:manage",
  TEAM_TRANSFER_OWNERSHIP: "team:transfer_ownership",

  // Special Permissions
  USER_MANAGE: "user:manage",
  
  // Role Identifiers
  IS_DOCTOR: "role:doctor",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
