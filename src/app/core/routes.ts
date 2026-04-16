export const ROUTE_LINKS = {
  dashboard: '/dashboard',
  profile: '/perfil',
  users: '/usuarios',
  groups: '/grupos',
  login: '/login',
  groupDashboard: (groupId: string) => `/grupo/${groupId}/dashboard`,
  groupList: (groupId: string) => `/grupo/${groupId}/lista`,
  groupManage: (groupId: string) => `/grupo/${groupId}/gestion-grupo`,
} as const;

