export interface User {
    id: string;
    email: string;
    phone?: string;
    username: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Unit {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    members: UnitMember[];
  }
  
  export interface UnitMember {
    id: string;
    role: 'admin' | 'member';
    userId: string;
    unitId: string;
    createdAt: string;
    updatedAt: string;
    user?: User;
    status: 'pending' | 'active' | 'blocked';
  }
  
  export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'inProgress' | 'completed';
    dueDate?: string;
    completionVideo?: string;
    createdAt: string;
    updatedAt: string;
    creatorId: string;
    assigneeId?: string;
    unitId: string;
    creator?: User;
    assignee?: User;
  }
  
  export interface Message {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    unitId: string;
  }