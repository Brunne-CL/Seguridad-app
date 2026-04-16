import { Injectable, signal, computed } from '@angular/core';
import {
  User,
  Group,
  Ticket,
  PERMISSIONS,
  TICKET_ESTADOS,
  TICKET_PRIORIDADES,
  type Permission,
  type TicketEstado,
  type TicketPrioridad,
} from './models';

const STORAGE_USERS = 'app-seguridad-users';
const STORAGE_GROUPS = 'app-seguridad-groups';
const STORAGE_TICKETS = 'app-seguridad-tickets';

const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/x/g, () =>
    ((Math.random() * 16) | 0).toString(16)
  );
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private usersSignal = signal<User[]>(this.loadUsers());
  private groupsSignal = signal<Group[]>(this.loadGroups());
  private ticketsSignal = signal<Ticket[]>(this.loadTickets());

  readonly users = this.usersSignal.asReadonly();
  readonly groups = this.groupsSignal.asReadonly();
  readonly tickets = this.ticketsSignal.asReadonly();

  constructor() {
    this.ensureSeed();
  }

  private loadUsers(): User[] {
    try {
      const raw = localStorage.getItem(STORAGE_USERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private loadGroups(): Group[] {
    try {
      const raw = localStorage.getItem(STORAGE_GROUPS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private loadTickets(): Ticket[] {
    try {
      const raw = localStorage.getItem(STORAGE_TICKETS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private persistUsers(list: User[]): void {
    this.usersSignal.set(list);
    localStorage.setItem(STORAGE_USERS, JSON.stringify(list));
  }

  private persistGroups(list: Group[]): void {
    this.groupsSignal.set(list);
    localStorage.setItem(STORAGE_GROUPS, JSON.stringify(list));
  }

  private persistTickets(list: Ticket[]): void {
    this.ticketsSignal.set(list);
    localStorage.setItem(STORAGE_TICKETS, JSON.stringify(list));
  }

  private ensureSeed(): void {
    const users = this.usersSignal();
    if (users.length === 0) {
      const superAdmin: User = {
        id: uuid(),
        usuario: 'superAdmin',
        email: 'super@admin.local',
        password: 'Seguridad@2025',
        nombreCompleto: 'Super Administrador',
        direccion: '-',
        telefono: '-',
        fechaNacimiento: new Date().toISOString(),
        permissions: [...ALL_PERMISSIONS],
        groupIds: [],
      };
      const admin: User = {
        id: uuid(),
        usuario: 'admin',
        email: 'admin@local',
        password: 'Seguridad@2025',
        nombreCompleto: 'Administrador',
        direccion: '-',
        telefono: '-',
        fechaNacimiento: new Date().toISOString(),
        permissions: [
          PERMISSIONS.GROUP_ADD,
          PERMISSIONS.GROUP_EDIT,
          PERMISSIONS.GROUP_DELETE,
          PERMISSIONS.TICKET_ADD,
          PERMISSIONS.TICKET_EDIT,
          PERMISSIONS.TICKET_EDIT_ASSIGN,
        ],
        groupIds: [],
      };
      this.persistUsers([superAdmin, admin]);
    }

    let groups = this.groupsSignal();
    if (groups.length === 0) {
      const userList = this.usersSignal();
      const g1: Group = {
        id: uuid(),
        nombre: 'Equipo Dev',
        userIds: userList.map((u) => u.id),
      };
      const g2: Group = {
        id: uuid(),
        nombre: 'Soporte',
        userIds: userList.map((u) => u.id),
      };
      const g3: Group = {
        id: uuid(),
        nombre: 'UX',
        userIds: userList.map((u) => u.id),
      };
      this.persistGroups([g1, g2, g3]);
      // Asignar grupos a usuarios
      const updated = userList.map((u) => ({
        ...u,
        groupIds: [g1.id, g2.id, g3.id],
      }));
      this.persistUsers(updated);
    }
  }

  getUserById(id: string): User | undefined {
    return this.usersSignal().find((u) => u.id === id);
  }

  getUserByUsuario(usuario: string): User | undefined {
    return this.usersSignal().find(
      (u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase()
    );
  }

  getGroupsForUser(userId: string): Group[] {
    const groups = this.groupsSignal();
    return groups.filter((g) => g.userIds.includes(userId));
  }

  getTicketsByGroupId(groupId: string): Ticket[] {
    return this.ticketsSignal().filter((t) => t.groupId === groupId);
  }

  getTicketById(id: string): Ticket | undefined {
    return this.ticketsSignal().find((t) => t.id === id);
  }

  createUser(user: Omit<User, 'id'>): User {
    const newUser: User = { ...user, id: uuid() };
    this.persistUsers([...this.usersSignal(), newUser]);
    return newUser;
  }

  updateUser(id: string, patch: Partial<Omit<User, 'id'>>): void {
    const list = this.usersSignal().map((u) =>
      u.id === id ? { ...u, ...patch } : u
    );
    this.persistUsers(list);
  }

  deleteUser(id: string): void {
    this.persistUsers(this.usersSignal().filter((u) => u.id !== id));
  }

  createGroup(nombre: string, userIds: string[]): Group {
    const g: Group = { id: uuid(), nombre, userIds };
    this.persistGroups([...this.groupsSignal(), g]);
    userIds.forEach((uid) => {
      const u = this.getUserById(uid);
      if (u && !u.groupIds.includes(g.id)) {
        this.updateUser(uid, { groupIds: [...u.groupIds, g.id] });
      }
    });
    return g;
  }

  updateGroup(id: string, patch: Partial<Pick<Group, 'nombre' | 'userIds'>>): void {
    const list = this.groupsSignal().map((g) =>
      g.id === id ? { ...g, ...patch } : g
    );
    this.persistGroups(list);
  }

  deleteGroup(id: string): void {
    this.persistGroups(this.groupsSignal().filter((g) => g.id !== id));
    this.persistTickets(this.ticketsSignal().filter((t) => t.groupId !== id));
  }

  addUserToGroup(groupId: string, userId: string): void {
    const g = this.groupsSignal().find((x) => x.id === groupId);
    if (!g || g.userIds.includes(userId)) return;
    this.updateGroup(groupId, { userIds: [...g.userIds, userId] });
    const u = this.getUserById(userId);
    if (u && !u.groupIds.includes(groupId)) {
      this.updateUser(userId, { groupIds: [...u.groupIds, groupId] });
    }
  }

  removeUserFromGroup(groupId: string, userId: string): void {
    const g = this.groupsSignal().find((x) => x.id === groupId);
    if (!g) return;
    this.updateGroup(groupId, { userIds: g.userIds.filter((id) => id !== userId) });
    const u = this.getUserById(userId);
    if (u) {
      this.updateUser(userId, { groupIds: u.groupIds.filter((id) => id !== groupId) });
    }
  }

  createTicket(
    groupId: string,
    creadorId: string,
    data: {
      titulo: string;
      descripcion: string;
      estado: TicketEstado;
      asignadoId: string | null;
      prioridad: TicketPrioridad;
      fechaLimite: string | null;
    }
  ): Ticket {
    const t: Ticket = {
      id: uuid(),
      groupId,
      creadorId,
      titulo: data.titulo,
      descripcion: data.descripcion,
      estado: data.estado,
      asignadoId: data.asignadoId,
      prioridad: data.prioridad,
      fechaCreacion: new Date().toISOString(),
      fechaLimite: data.fechaLimite,
      comentarios: [],
      historial: [],
    };
    this.persistTickets([...this.ticketsSignal(), t]);
    return t;
  }

  updateTicket(
    id: string,
    patch: Partial<Pick<Ticket, 'titulo' | 'descripcion' | 'estado' | 'asignadoId' | 'prioridad' | 'fechaLimite'>>,
    userId: string,
    userName: string
  ): void {
    const tickets = this.ticketsSignal();
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return;

    const historial = [...ticket.historial];
    (Object.keys(patch) as (keyof typeof patch)[]).forEach((key) => {
      const oldVal = String((ticket as unknown as Record<string, unknown>)[key] ?? '');
      const newVal = String((patch as Record<string, unknown>)[key] ?? '');
      if (oldVal !== newVal) {
        historial.push({
          id: uuid(),
          ticketId: id,
          userId,
          userName,
          field: key,
          oldValue: oldVal,
          newValue: newVal,
          createdAt: new Date().toISOString(),
        });
      }
    });

    const updated: Ticket = {
      ...ticket,
      ...patch,
      comentarios: ticket.comentarios,
      historial,
    };
    this.persistTickets(tickets.map((t) => (t.id === id ? updated : t)));
  }

  addComment(ticketId: string, userId: string, userName: string, text: string): void {
    const tickets = this.ticketsSignal();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    const comment = {
      id: uuid(),
      ticketId,
      userId,
      userName,
      text,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...ticket,
      comentarios: [...ticket.comentarios, comment],
    };
    this.persistTickets(
      tickets.map((t) => (t.id === ticketId ? updated : t))
    );
  }

  setTicketEstado(ticketId: string, estado: TicketEstado, userId: string, userName: string): void {
    this.updateTicket(ticketId, { estado }, userId, userName);
  }
}
