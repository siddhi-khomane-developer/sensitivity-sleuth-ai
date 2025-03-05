
import React, { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import ClassificationResult from '../components/ClassificationResult';
import Dashboard from '../components/Dashboard';
import Navbar from '../components/Navbar';
import { toast } from '@/components/ui/use-toast';
import { ClassificationResult as ClassificationResultType, SensitivityFeedback } from '../types';
import { classifyFile, submitFeedback } from '../utils/classificationUtils';
import { Button } from '@/components/ui/button'; // Fix the import

const Index = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ClassificationResultType[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Check for system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };
  
  const handleFileUpload = async (files: File[]) => {
    setIsProcessing(true);
    const newResults: ClassificationResultType[] = [];
    
    try {
      // Process files one by one (in a real app, we'd use batch processing)
      for (const file of files) {
        const result = await classifyFile(file);
        newResults.push(result);
      }
      
      setResults(newResults);
      
      toast({
        title: "Files classified successfully",
        description: `${files.length} file${files.length > 1 ? 's' : ''} processed`,
      });
    } catch (error) {
      console.error("Error classifying files:", error);
      toast({
        title: "Classification failed",
        description: "There was an error processing your files",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleFeedback = async (fileId: string, feedback: SensitivityFeedback) => {
    try {
      await submitFeedback(fileId, feedback);
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Feedback submission failed",
        description: "There was an error submitting your feedback",
        variant: "destructive",
      });
    }
  };
  
  const handleClearResults = () => {
    setResults([]);
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        toggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
      />
      
      <main className="flex-1 container py-8">
        {activeTab === 'upload' ? (
          <div className="animate-fade-in">
            <div className="max-w-3xl mx-auto mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                AI Document Sensitivity Classifier
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Upload documents to automatically classify their sensitivity level using metadata analysis. 
                Our AI model determines if your document contains sensitive information.
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto mb-8">
              <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
            </div>
            
            {results.length > 0 && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Classification Results</h2>
                  <button 
                    onClick={handleClearResults}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear results
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((result) => (
                    <ClassificationResult 
                      key={result.id} 
                      result={result} 
                      onFeedback={handleFeedback}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Dashboard />
        )}
      </main>
      
      <footer className="border-t py-4 bg-background">
        <div className="container flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SensitivitySleuth AI
          </p>
          <p className="text-sm text-muted-foreground">
            Protect your sensitive documents with confidence
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
