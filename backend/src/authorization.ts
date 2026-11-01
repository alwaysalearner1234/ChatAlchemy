export type TwitchRoles = { broadcaster: boolean; moderator: boolean };

export function isAuthorizedController(
  login: string | undefined,
  roles: TwitchRoles,
  streamerLogin: string | undefined,
  moderatorLogins: string[],
): boolean {
  if (!login) return false;
  const normalized = login.toLowerCase();
  if (roles.broadcaster && streamerLogin?.toLowerCase() === normalized) return true;
  return roles.moderator && moderatorLogins.some(name => name.trim().toLowerCase() === normalized);
}
