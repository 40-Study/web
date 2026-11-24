/** QA6-A11: `?role=` lạ (không phải vai trò hệ thống nào) bị bỏ qua như `?status=` lạ, không để ô chọn hiện mã thô. */
export function parseRoleParam(raw: string | null, knownRoles: readonly string[]): string {
  return raw !== null && knownRoles.includes(raw) ? raw : "ALL";
}
