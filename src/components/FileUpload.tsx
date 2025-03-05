
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles);
    }
  }, [onFileUpload]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isProcessing,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
    }
  });
  
  React.useEffect(() => {
    setDragActive(isDragActive);
  }, [isDragActive]);
  
  return (
    <Card className={cn(
      "relative p-12 border border-dashed rounded-xl transition-all duration-300 bg-background",
      dragActive ? "border-primary bg-primary/5" : "border-border",
      isProcessing ? "opacity-70 cursor-not-allowed" : "hover:border-primary/50 hover:bg-primary/5"
    )}>
      <div
        {...getRootProps()}
        className="flex flex-col items-center justify-center text-center"
      >
        <input {...getInputProps()} />
        
        <div className="mb-4">
          <div className={cn(
            "p-4 rounded-full bg-primary/10 text-primary",
            "transform transition-transform duration-300",
            dragActive ? "scale-110" : ""
          )}>
            {dragActive ? (
              <FileText size={34} className="animate-pulse" />
            ) : (
              <Upload size={34} />
            )}
          </div>
        </div>
        
        <h3 className="text-lg font-medium mb-2">
          {dragActive
            ? "Drop files here"
            : isProcessing
              ? "Processing..."
              : "Drag & drop files here"}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          {dragActive
            ? "Release to upload"
            : "or click to browse from your computer"}
        </p>
        
        {!dragActive && !isProcessing && (
          <div className="flex items-center text-xs text-muted-foreground mt-2">
            <AlertCircle size={14} className="mr-1" />
            <span>Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, ZIP, RAR</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FileUpload;
