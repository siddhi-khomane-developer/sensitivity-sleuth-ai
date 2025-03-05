
export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  extension: string;
  location: string;
  owner: string;
  created: Date;
  modified: Date;
  permissions: string;
}

export interface ClassificationResult {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  extension: string;
  sensitivity: 'Sensitive' | 'Non-Sensitive';
  confidenceScore: number;
  encryptionLevel: 'Strongest' | 'Moderate' | 'Basic';
  classifiedAt: Date;
}

export type SensitivityFeedback = 'correct' | 'incorrect';
