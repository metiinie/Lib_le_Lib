export type UserRole =
  | 'member'
  | 'verification_officer'
  | 'moderator'
  | 'admin'
  | 'health_professional';

export type UserStatus = 'pending' | 'active' | 'suspended' | 'banned';

export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  profile?: {
    fullName?: string;
    nickname?: string;
    displayName?: string;
    dateOfBirth?: string;
    birthDate?: string;
    regionId?: string;
    city?: string;
    bio?: string;
  } | null;
}

export interface VerificationDocument {
  id: string;
  documentType: string;
  uploadedAt: string;
  url: string | null;
}

export interface VerificationSubmission {
  id: string;
  userId: string;
  status: 'submitted' | 'in_review' | 'approved' | 'rejected' | 'expired';
  rejectionReason?: string;
  submittedAt?: string;
  createdAt?: string;
  decisionAt?: string;
  method?: string;
  user?: User;
  idDocumentUrl?: string;
  selfieUrl?: string;
  documents?: VerificationDocument[];
}

export type ReportCategory =
  | 'harassment'
  | 'fake_profile'
  | 'outing_threat'
  | 'solicitation'
  | 'scam'
  | 'underage_suspicion'
  | 'other';

export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ModerationReport {
  id: string;
  reporterId: string;
  reporterUserId?: string;
  reportedId: string;
  reportedUserId?: string;
  matchId?: string;
  category: ReportCategory;
  description?: string;
  details?: string;
  evidenceRef?: string;
  status: ReportStatus;
  severity: ReportSeverity;
  assignedToId?: string;
  createdAt: string;
  resolvedAt?: string;
  reported?: User;
  reporter?: User;
  reportedUser?: User;
  reporterUser?: User;
}

export interface ResourceItem {
  id: string;
  title: string;
  category: 'treatment_info' | 'u_equals_u' | 'hotline' | 'general';
  body: string;
  published: boolean;
  createdByUserId: string;
  createdAt: string;
}

export interface QAThread {
  id: string;
  memberUserId: string;
  question: string;
  category: string;
  isAnswered: boolean;
  answer?: string;
  answeredByUserId?: string;
  createdAt: string;
  answeredAt?: string;
}

export interface SuccessStory {
  id: string;
  submittedByUserId?: string;
  title: string;
  storyContent?: string;
  storyText?: string;
  isApproved?: boolean;
  published?: boolean;
  approvedByUserId?: string;
  createdAt?: string;
  publishedAt?: string;
}


export interface AuditLog {
  id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type SubscriptionPlan = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'past_due';

export interface Subscription {
  id: string;
  userId: string;
  user?: User;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  paymentProvider?: string;
  externalSubscriptionId?: string;
  startedAt: string;
  currentPeriodEnd?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}
