export const PERMISSIONS = {
  PATIENT_CREATE: "patient:create",
  PATIENT_VIEW_ALL: "patient:view:all",
  SETTINGS_EDIT: "settings:edit",
  USER_MANAGE: "user:manage", // Invite/remove users from clinic
  CLINIC_OWNER_MANAGE: "clinic_owner:manage",
  ROLE_MANAGE: "role:manage",
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
