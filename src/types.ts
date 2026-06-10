export interface CVScreenResults {
  candidateName: string;
  email: string;
  phone: string;
  yearsOfExperience: number;
  education: string;
  matchScore: number;
  technicalScore: number;
  experienceScore: number;
  educationScore: number;
  summary: string;
  technicalSkillsMatched: string[];
  technicalSkillsMissing: string[];
  strengths: string[];
  weaknesses: string[];
  interviewQuestions: string[];
  recommendation: "Phù hợp" | "Cân nhắc" | "Không phù hợp" | string;
  reason: string;
}

export interface Candidate {
  id: string;
  fileName: string;
  fileType: "pdf" | "txt" | "docx" | "text" | string;
  size?: string;
  textContent?: string;
  base64?: string;
  mimeType?: string;
  status: "idle" | "scanning" | "success" | "error";
  errorMsg?: string;
  results?: CVScreenResults;
  notes?: string; // local custom notes added by the recruiter
}

export interface JDTemplate {
  id: string;
  title: string;
  department: string;
  fullText: string;
}
