export interface ActionUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  role?: string;
}

export interface ActionFolioLink {
  folio: { id: string; name: string };
}

export interface ActionAssignee {
  user: ActionUser;
}

export interface ActionAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  thumbnailUrl: string | null;
}

export interface ActionComment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl?: string | null };
}

export interface Action {
  id: string;
  airtableId: string | null;
  code: string | null;
  sequenceNo: number | null;
  title: string;
  brief: string | null;
  businessTerms: string | null;
  status: string | null;
  actionType: string | null;
  contextTags: string[];
  accrueDate: string | null;
  startAt: string | null;
  endAt: string | null;
  durationHours: number | null;
  wbs: string | null;
  stage: string | null;
  placeOfPerform: string | null;
  periodOfPerform: string | null;
  sort: number | null;
  number: number | null;
  boardPosition: Record<string, unknown> | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  airtableCreatedAt: string | null;
  airtableUpdatedAt: string | null;
  assignees?: ActionAssignee[];
  pocContacts?: { user: ActionUser }[];
  folioLinks?: ActionFolioLink[];
  attachments?: ActionAttachment[];
  comments?: ActionComment[];
  activityLogs?: ActivityLogEntry[];
  _count?: { comments: number; attachments: number };
}

export interface ActivityLogEntry {
  id: string;
  event: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  changes?: Record<string, unknown>;
  user?: { id: string; name: string; avatarUrl?: string | null } | null;
}
