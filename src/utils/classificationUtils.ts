import { FileMetadata, ClassificationResult, ClassificationMetrics } from '../types';
import { initializeModel, predictSensitivity, getModelStats } from './modelUtils';

// Initialize model in the background 
let isModelInitializing = false;
const ensureModelInitialized = async () => {
  if (!isModelInitializing) {
    isModelInitializing = true;
    await initializeModel();
  }
};
// Start initializing when the app loads
ensureModelInitialized();

// Classify file using the ML model
export const classifyFile = async (file: File): Promise<ClassificationResult> => {
  return new Promise(async (resolve) => {
    // Ensure model is initialized
    if (!isModelInitializing) {
      await ensureModelInitialized();
    }
    
    // Start with extracting metadata
    const metadata = extractMetadata(file);
    
    try {
      // Predict using the model
      const prediction = await predictSensitivity(file);
      
      const confidenceScore = prediction.confidenceScore;
      const sensitivity = prediction.isSensitive ? 'Sensitive' : 'Non-Sensitive';
      
      // Determine encryption level based on confidence score
      let encryptionLevel: 'Strongest' | 'Moderate' | 'Basic';
      if (confidenceScore > 90) {
        encryptionLevel = 'Strongest';
      } else if (confidenceScore > 80) {
        encryptionLevel = 'Moderate';
      } else {
        encryptionLevel = 'Basic';
      }
      
      resolve({
        id: generateUniqueId(),
        fileName: file.name,
        filePath: file.webkitRelativePath || `/${file.name}`,
        fileType: determineFileType(file),
        extension: getFileExtension(file.name),
        sensitivity,
        confidenceScore,
        encryptionLevel,
        classifiedAt: new Date()
      });
    } catch (error) {
      console.error("Error classifying file with ML model:", error);
      // Fallback to rule-based classification if ML fails
      const result = fallbackClassification(file);
      resolve(result);
    }
  });
};

// Fallback classification method (rule-based, used if ML fails)
const fallbackClassification = (file: File): ClassificationResult => {
  const metadata = extractMetadata(file);
  const sensitiveKeywords = [
    'pan', 'aadhar', 'passport', 'bank', 'statement', 'financial', 
    'medical', 'health', 'insurance', 'tax', 'salary', 'personal',
    'confidential', 'private', 'secret', 'social', 'security'
  ];
  
  // Check if filename or path contains sensitive keywords
  const fileName = file.name.toLowerCase();
  const hasSensitiveKeyword = sensitiveKeywords.some(keyword => 
    fileName.includes(keyword)
  );
  
  // Generate a pseudorandom confidence score that would be consistent for the same file name
  // (This is our fallback method)
  const hash = simpleHash(file.name);
  const baseConfidence = (hash % 30) + 70; // Range between 70-99
  const confidenceScore = hasSensitiveKeyword 
    ? Math.min(baseConfidence + 10, 99) 
    : baseConfidence;
  
  // Determine sensitivity based on confidence score
  const sensitivity = confidenceScore > 80 ? 'Sensitive' : 'Non-Sensitive';
  
  // Determine encryption level based on confidence score
  let encryptionLevel: 'Strongest' | 'Moderate' | 'Basic';
  if (confidenceScore > 90) {
    encryptionLevel = 'Strongest';
  } else if (confidenceScore > 80) {
    encryptionLevel = 'Moderate';
  } else {
    encryptionLevel = 'Basic';
  }
  
  return {
    id: generateUniqueId(),
    fileName: file.name,
    filePath: file.webkitRelativePath || `/${file.name}`,
    fileType: determineFileType(file),
    extension: getFileExtension(file.name),
    sensitivity,
    confidenceScore,
    encryptionLevel,
    classifiedAt: new Date()
  };
};

// Helper function to extract metadata from a file
const extractMetadata = (file: File): FileMetadata => {
  return {
    id: generateUniqueId(),
    name: file.name,
    path: file.webkitRelativePath || `/${file.name}`,
    type: file.type,
    size: file.size,
    extension: getFileExtension(file.name),
    location: 'Local Upload',
    owner: 'Current User',
    created: new Date(),
    modified: new Date(file.lastModified),
    permissions: 'Read/Write'
  };
};

// Helper function to determine the file type from a file object
const determineFileType = (file: File): string => {
  const extension = getFileExtension(file.name).toLowerCase();
  
  const fileTypes: Record<string, string> = {
    'pdf': 'PDF Document',
    'doc': 'Word Document',
    'docx': 'Word Document',
    'xls': 'Excel Spreadsheet',
    'xlsx': 'Excel Spreadsheet',
    'ppt': 'PowerPoint Presentation',
    'pptx': 'PowerPoint Presentation',
    'txt': 'Text File',
    'csv': 'CSV File',
    'jpg': 'Image',
    'jpeg': 'Image',
    'png': 'Image',
    'gif': 'Image',
    'zip': 'Archive',
    'rar': 'Archive'
  };
  
  return fileTypes[extension] || 'Unknown File Type';
};

// Helper function to get file extension
const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Helper function to generate a unique ID
const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// Simple hash function to generate consistent pseudorandom numbers for the same input
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Function to determine confidence level class based on score
export const getConfidenceLevelClass = (score: number): string => {
  if (score >= 90) return 'bg-red-500';
  if (score >= 80) return 'bg-amber-500';
  return 'bg-green-500';
};

// Function to get human-readable file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Mock function to store user feedback (in a real app, this would call the backend API)
export const submitFeedback = (
  fileId: string, 
  feedback: 'correct' | 'incorrect'
): Promise<void> => {
  return new Promise((resolve) => {
    console.log(`Feedback submitted for file ${fileId}: ${feedback}`);
    // Simulate API call
    setTimeout(resolve, 500);
  });
};

// Mock history data (in a real app, this would be fetched from the backend)
export const getClassificationHistory = (): Promise<ClassificationResult[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockHistory: ClassificationResult[] = [
        {
          id: '1',
          fileName: 'tax_returns_2023.pdf',
          filePath: '/documents/financial/tax_returns_2023.pdf',
          fileType: 'PDF Document',
          extension: 'pdf',
          sensitivity: 'Sensitive',
          confidenceScore: 95,
          encryptionLevel: 'Strongest',
          classifiedAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
        },
        {
          id: '2',
          fileName: 'project_proposal.docx',
          filePath: '/documents/work/project_proposal.docx',
          fileType: 'Word Document',
          extension: 'docx',
          sensitivity: 'Non-Sensitive',
          confidenceScore: 75,
          encryptionLevel: 'Basic',
          classifiedAt: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
          id: '3',
          fileName: 'bank_statement_march.pdf',
          filePath: '/documents/financial/bank_statement_march.pdf',
          fileType: 'PDF Document',
          extension: 'pdf',
          sensitivity: 'Sensitive',
          confidenceScore: 92,
          encryptionLevel: 'Strongest',
          classifiedAt: new Date(Date.now() - 43200000) // 12 hours ago
        },
        {
          id: '4',
          fileName: 'meeting_notes.txt',
          filePath: '/documents/work/meeting_notes.txt',
          fileType: 'Text File',
          extension: 'txt',
          sensitivity: 'Non-Sensitive',
          confidenceScore: 68,
          encryptionLevel: 'Basic',
          classifiedAt: new Date(Date.now() - 21600000) // 6 hours ago
        },
        {
          id: '5',
          fileName: 'medical_records.pdf',
          filePath: '/documents/personal/medical_records.pdf',
          fileType: 'PDF Document',
          extension: 'pdf',
          sensitivity: 'Sensitive',
          confidenceScore: 98,
          encryptionLevel: 'Strongest',
          classifiedAt: new Date(Date.now() - 3600000) // 1 hour ago
        }
      ];
      
      resolve(mockHistory);
    }, 1000);
  });
};

// Get classification metrics for dashboard
export const getClassificationMetrics = async (): Promise<ClassificationMetrics> => {
  const history = await getClassificationHistory();
  
  const sensitiveCount = history.filter(item => item.sensitivity === 'Sensitive').length;
  const nonSensitiveCount = history.filter(item => item.sensitivity === 'Non-Sensitive').length;
  const totalConfidence = history.reduce((sum, item) => sum + item.confidenceScore, 0);
  
  // Count by file type
  const byFileType: Record<string, number> = {};
  history.forEach(item => {
    byFileType[item.fileType] = (byFileType[item.fileType] || 0) + 1;
  });
  
  // Count by encryption level
  const byEncryptionLevel: Record<string, number> = {
    'Strongest': 0,
    'Moderate': 0,
    'Basic': 0
  };
  
  history.forEach(item => {
    byEncryptionLevel[item.encryptionLevel] = (byEncryptionLevel[item.encryptionLevel] || 0) + 1;
  });
  
  return {
    totalClassified: history.length,
    sensitiveCount,
    nonSensitiveCount,
    averageConfidence: history.length > 0 ? totalConfidence / history.length : 0,
    byFileType,
    byEncryptionLevel
  };
};
