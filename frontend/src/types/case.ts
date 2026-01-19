export type CaseStatus = "pending" | "active" | "hearing" | "verdict_pending" | "closed" | "appealed";
export type EvidenceCategory = "document" | "video" | "audio" | "image" | "other";
export type RoleCategory = "judiciary" | "legal_practitioner" | "public_party";
export type EvidenceStatus = "draft" | "pending" | "signed" | "immutable";
export type EvidenceType = "forensic" | "cctv" | "witness" | "document" | "audio" | "other";

// --- Legacy Types for backward compatibility ---

export interface Evidence {
  id: string;
  caseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string;
  thumbnailUrl?: string;
  type: EvidenceType;
  status: EvidenceStatus;
  uploadedBy: string;
  uploadedAt: string;
  hash?: string;
  signedBy?: string;
  signedAt?: string;
  signature?: string;
  hearingSessionId?: string;
}

export interface CustodyEvent {
  id: string;
  caseId: string;
  action: string;
  actor: string;
  timestamp: string;
  details: string;
  txHash?: string;
}

export interface AuthorizedPerson {
  id: string;
  name: string;
  role: string;
  department: string;
  govId: string;
  addedAt: string;
}

// --- NEW INTERFACES ---

export interface Profile {
  id: string;
  full_name: string;
  role: 'judge' | 'lawyer' | 'clerk' | 'client' | string;
  email?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CaseFile {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  caseNumber: string;
  caseType: string;
  courtName?: string;
  partyA: string;
  partyB: string;
  createdAt: string;
  updatedAt: string;
  evidenceCount: number;
}

// List Item Interface
export interface CauseListItem {
  id: string;
  srNo: number;
  caseNumber: string;
  parties: string;
  caseType: string;
  stage: string;
  status: "scheduled" | "in-progress" | "completed" | "adjourned";
  time?: string;
  isUrgent: boolean;
}

export interface JudgmentItem {
  id: string;
  
  caseNumber: string;
  parties: string;
  hearingDate: string;
  draftProgress: number;
  dueDate: string;
  isOverdue?: boolean;
}

// --- Police / FIR Types ---
export type FIRStatus = 'Registered' | 'Under Investigation' | 'Chargesheet Filed' | 'Closed';

export interface FIR {
  id: string;
  fir_number: string;
  police_station: string;
  informant_name: string;
  informant_contact: string;
  incident_date: string; // ISO timestamp
  incident_place: string;
  offense_nature: string;
  bns_section: string;
  accused_name?: string | null;
  victim_name: string;
  description?: string;
  status: FIRStatus;
  created_at?: string;
  officer_id?: string; // auth.users id
}

export type InvestigationFileType = 'Supplementary Chargesheet' | 'Forensic Report' | 'Witness Statement';

export interface InvestigationFile {
  id: string;
  fir_id: string;
  file_url: string;
  file_type: InvestigationFileType;
  notes?: string;
  uploaded_at?: string;
}