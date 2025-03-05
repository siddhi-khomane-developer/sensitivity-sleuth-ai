
import React from 'react';
import { ClassificationResult as ClassificationResultType, SensitivityFeedback } from '../types';
import { getConfidenceLevelClass, formatFileSize } from '../utils/classificationUtils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Shield, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassificationResultProps {
  result: ClassificationResultType;
  onFeedback?: (fileId: string, feedback: SensitivityFeedback) => void;
}

const ClassificationResult: React.FC<ClassificationResultProps> = ({ result, onFeedback }) => {
  const confidenceLevelClass = getConfidenceLevelClass(result.confidenceScore);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(result.classifiedAt);
  
  const encryptionColors = {
    'Strongest': 'bg-red-500',
    'Moderate': 'bg-amber-500',
    'Basic': 'bg-green-500'
  };
  
  const sensitivityColors = {
    'Sensitive': 'bg-red-500 text-white',
    'Non-Sensitive': 'bg-green-500 text-white'
  };
  
  return (
    <Card className="glass-card overflow-hidden animate-scale-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-primary/10 text-primary mr-3">
              <FileText size={20} />
            </div>
            <CardTitle className="text-lg">{result.fileName}</CardTitle>
          </div>
          <Badge className={cn("font-medium", sensitivityColors[result.sensitivity])}>
            {result.sensitivity}
          </Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground truncate">
          {result.filePath}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">File Type</div>
            <div className="font-medium">
              {result.fileType} (.{result.extension})
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground mb-1">Encryption Level</div>
            <div className="flex items-center">
              <Shield size={16} className="mr-1 text-primary" />
              <span className="font-medium">{result.encryptionLevel}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">Confidence Score</div>
            <div className="font-medium">{result.confidenceScore}%</div>
          </div>
          <Progress value={result.confidenceScore} className={cn("h-2", confidenceLevelClass)} />
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between items-center">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock size={14} className="mr-1" />
          <span>Classified: {formattedDate}</span>
        </div>
        
        {onFeedback && (
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 px-2 text-green-500 hover:text-green-600 hover:bg-green-50"
              onClick={() => onFeedback(result.id, 'correct')}
            >
              <ThumbsUp size={16} className="mr-1" />
              <span className="text-xs">Correct</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onFeedback(result.id, 'incorrect')}
            >
              <ThumbsDown size={16} className="mr-1" />
              <span className="text-xs">Incorrect</span>
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ClassificationResult;
