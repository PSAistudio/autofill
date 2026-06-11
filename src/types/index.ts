export interface Profile {
  id: string;
  name: string;
  encryptedData: string;
  iv: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
  fieldCount: number;
  tags: string[];
}

export interface ProfileField {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'date' | 'select' | 'textarea';
  category: 'personal' | 'address' | 'contact' | 'work' | 'payment' | 'custom';
  options?: string[];
}

export interface FormAnalysis {
  formId: string;
  url: string;
  fields: AnalyzedField[];
  suggestions: AutofillSuggestion[];
  language: 'th' | 'en' | 'mixed';
  confidence: number;
}

export interface AnalyzedField {
  name: string;
  type: string;
  label: string;
  category: string;
  required: boolean;
  autofillCompatible: boolean;
}

export interface AutofillSuggestion {
  fieldName: string;
  profileField: string;
  confidence: number;
  rule: string;
}

export interface ClassificationResult {
  formType: string;
  category: string;
  language: 'th' | 'en' | 'mixed';
  fields: ClassifiedField[];
  confidence: number;
}

export interface ClassifiedField {
  name: string;
  semanticType: string;
  label: string;
  confidence: number;
}

export interface AnalyticsEvent {
  id: string;
  type: 'autofill' | 'analysis' | 'classification' | 'profile_create' | 'profile_update';
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface AnalyticsSummary {
  totalAutofills: number;
  totalAnalyses: number;
  totalClassifications: number;
  totalProfiles: number;
  autofillsByDay: { date: string; count: number }[];
  topFormTypes: { type: string; count: number }[];
  languageDistribution: { language: string; count: number }[];
  averageConfidence: number;
}

export interface UserSettings {
  defaultLanguage: 'th' | 'en' | 'auto';
  autoClassify: boolean;
  encryptProfiles: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  maxProfiles: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  expiresAt: string;
}
