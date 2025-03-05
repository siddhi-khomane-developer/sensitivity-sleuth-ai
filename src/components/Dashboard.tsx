
import React, { useEffect, useState } from 'react';
import { ClassificationResult } from '../types';
import { getClassificationHistory } from '../utils/classificationUtils';
import FileItem from './FileItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Shield, File } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [history, setHistory] = useState<ClassificationResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getClassificationHistory();
        setHistory(data);
      } catch (error) {
        console.error('Error fetching classification history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, []);
  
  const sensitiveFiles = history.filter(file => file.sensitivity === 'Sensitive');
  const nonSensitiveFiles = history.filter(file => file.sensitivity === 'Non-Sensitive');
  
  const statsData = [
    {
      label: 'Total Files',
      value: history.length,
      icon: <File size={18} className="text-primary" />,
      color: 'bg-primary/10'
    },
    {
      label: 'Sensitive Files',
      value: sensitiveFiles.length,
      icon: <Shield size={18} className="text-red-500" />,
      color: 'bg-red-500/10'
    },
    {
      label: 'Avg. Confidence',
      value: history.length > 0 
        ? `${Math.round(history.reduce((acc, file) => acc + file.confidenceScore, 0) / history.length)}%` 
        : '0%',
      icon: <AlertCircle size={18} className="text-amber-500" />,
      color: 'bg-amber-500/10'
    }
  ];
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsData.map((stat, index) => (
          <Card key={index} className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Classification History</CardTitle>
          <CardDescription>
            View all your previously classified documents
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All Files
                <Badge className="ml-2 bg-primary/10 text-primary">{history.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="sensitive">
                Sensitive
                <Badge className="ml-2 bg-red-500/10 text-red-500">{sensitiveFiles.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="non-sensitive">
                Non-Sensitive
                <Badge className="ml-2 bg-green-500/10 text-green-500">{nonSensitiveFiles.length}</Badge>
              </TabsTrigger>
            </TabsList>
            
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading history...</p>
              </div>
            ) : (
              <>
                <TabsContent value="all">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-1">
                      {history.length > 0 ? (
                        history.map(file => (
                          <FileItem key={file.id} file={file} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No files classified yet
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="sensitive">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-1">
                      {sensitiveFiles.length > 0 ? (
                        sensitiveFiles.map(file => (
                          <FileItem key={file.id} file={file} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No sensitive files classified yet
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="non-sensitive">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-1">
                      {nonSensitiveFiles.length > 0 ? (
                        nonSensitiveFiles.map(file => (
                          <FileItem key={file.id} file={file} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No non-sensitive files classified yet
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
