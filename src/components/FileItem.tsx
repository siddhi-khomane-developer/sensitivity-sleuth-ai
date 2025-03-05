
import React from 'react';
import { ClassificationResult } from '../types';
import { getConfidenceLevelClass } from '../utils/classificationUtils';
import { FileText, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileItemProps {
  file: ClassificationResult;
}

const FileItem: React.FC<FileItemProps> = ({ file }) => {
  const confidenceLevelClass = getConfidenceLevelClass(file.confidenceScore);
  
  // Format the date to a more readable format
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(file.classifiedAt);
  
  const getIconColor = (level: string) => {
    switch (level) {
      case 'Strongest': return 'text-red-500';
      case 'Moderate': return 'text-amber-500';
      case 'Basic': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };
  
  return (
    <div className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="p-2 rounded-full bg-primary/10 text-primary">
        <FileText size={18} />
      </div>
      
      <div className="ml-3 flex-grow min-w-0">
        <div className="flex items-center">
          <h4 className="font-medium text-sm truncate">{file.fileName}</h4>
          <div className={cn(
            "ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium",
            file.sensitivity === 'Sensitive' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          )}>
            {file.sensitivity}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {file.filePath}
        </div>
        
        <div className="mt-1.5">
          <Progress value={file.confidenceScore} className={cn("h-1.5", confidenceLevelClass)} />
        </div>
      </div>
      
      <div className="ml-4 flex items-center">
        <div className="flex flex-col items-end mr-4">
          <div className="text-xs font-medium">{file.confidenceScore}%</div>
          <div className="text-xs text-muted-foreground">{formattedDate}</div>
        </div>
        
        <div className={cn("flex items-center", getIconColor(file.encryptionLevel))}>
          <Shield size={16} className="mr-1" />
          <span className="text-xs font-medium">{file.encryptionLevel}</span>
        </div>
      </div>
    </div>
  );
};

export default FileItem;
