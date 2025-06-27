export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'super_admin' | 'admin' | 'employee';
  position?: string;
  permissions?: string[];
  organizationId?: string; // null for super_admin
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string; // URL-friendly name
  domain?: string;
  logo?: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  adminId: string;
  settings: {
    allowEmployeeRegistration: boolean;
    maxUsers: number;
    features: string[];
  };
  billing: {
    subscriptionId?: string;
    currentPeriodEnd?: Date;
    trialEnd?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigneeId: string;
  createdById: string;
  organizationId: string;
  startDate?: Date;
  dueDate?: Date;
  tags: string[];
  attachments: Attachment[];
  subtasks: Subtask[];
  comments: Comment[];
  activities: Activity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  userId: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  color: string;
  organizationId: string;
}

export interface ChatCategory {
  id: string;
  name: string;
  organizationId: string;
  order: number;
  createdBy: string;
  createdAt: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  privacy: 'public' | 'private';
  categoryId: string | null;
  allowedRoles: string[];
  members: string[];
  organizationId: string;
  createdBy: string;
  createdAt: string;
  lastReadBy?: { userId: string; lastReadMessageId: string }[];
}

export interface ChatMessage {
  id: string;
  channelId: string;
  content: string;
  authorId: string;
  createdAt: string;
  edited?: boolean;
  replyTo?: string | null;
  attachment?: {
    url: string;
    name: string;
    size: number;
    type: string;
  };
  reactions?: {
    emoji: string;
    userIds: string[];
  }[];
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  meetLink: string;
  organizationId: string;
  createdBy: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export interface SuperAdminStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyGrowth: number;
  planDistribution: {
    free: number;
    pro: number;
    enterprise: number;
  };
}