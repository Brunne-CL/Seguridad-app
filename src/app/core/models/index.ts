/** Permisos: todo se perfila por permisos, NO por roles. */
export const PERMISSIONS = {
  // Usuario
  USER_VIEW: 'user:view',
  USER_ADD: 'user:add',
  USER_EDIT: 'user:edit',
  USER_EDIT_PROFILE: 'user:edit:profile',
  USER_DELETE: 'user:delete',
  USER_ASSIGN: 'user:assign',
  USER_VIEW_ALL: 'user:view:all',
  USER_EDIT_PERMISSIONS: 'user:edite:permissions', // se respeta el valor que viene del backend
  USER_DEACTIVATE: 'user:deactivate',
  USER_ACTIVATE: 'user:activate',
  USER_MANAGE: 'user:manage',

  // Grupo
  GROUP_VIEW: 'group:view',
  GROUP_ADD: 'group:add',
  GROUP_EDIT: 'group:edit',
  GROUP_DELETE: 'group:delete',
  GROUP_ADD_MEMBER: 'group:add:member',
  GROUP_REMOVE_MEMBER: 'group:remove:member',
  GROUP_MANAGE: 'group:manage',

  // Ticket
  TICKET_VIEW: 'ticket:view',
  TICKET_ADD: 'ticket:add',
  TICKET_EDIT: 'ticket:edit',
  TICKET_DELETE: 'ticket:delete',
  TICKET_EDIT_STATE: 'ticket:edit:state',
  TICKET_EDIT_COMMENT: 'ticket:edit:comment',
  TICKET_EDIT_PRIORITY: 'ticket:edit:priority',
  TICKET_EDIT_DEADLINE: 'ticket:edit:deadline',
  TICKET_EDIT_ASSIGN: 'ticket:edit:asiggn', // se respeta el valor que viene del backend
  TICKET_MANAGE: 'ticket:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const TICKET_ESTADOS = ['Pendiente', 'En progreso', 'Revisión', 'Hecho', 'Bloqueado'] as const;
export type TicketEstado = (typeof TICKET_ESTADOS)[number];

export const TICKET_PRIORIDADES = ['Alta', 'Media', 'Baja'] as const;
export type TicketPrioridad = (typeof TICKET_PRIORIDADES)[number];

export interface User {
  id: string;
  usuario: string;
  email: string;
  password: string;
  nombreCompleto: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string; // ISO
  permissions: Permission[];
  groupIds: string[]; // grupos a los que pertenece
}

export interface Group {
  id: string;
  nombre: string;
  userIds: string[];
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string; // ISO
}

export interface TicketChangeRecord {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  field: string;
  oldValue: string;
  newValue: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  groupId: string;
  titulo: string;
  descripcion: string;
  estado: TicketEstado;
  asignadoId: string | null;
  creadorId: string;
  prioridad: TicketPrioridad;
  fechaCreacion: string;
  fechaLimite: string | null;
  comentarios: TicketComment[];
  historial: TicketChangeRecord[];
}
