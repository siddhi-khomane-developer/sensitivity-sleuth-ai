
import React, { useEffect, useState } from 'react';
import { ClassificationResult, ClassificationMetrics } from '../types';
import { getClassificationHistory, getClassificationMetrics } from '../utils/classificationUtils';
import { getModelStats } from '../utils/modelUtils';
import FileItem from './FileItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Shield, File, Brain, BarChart, PieChart } from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Legend
} from 'recharts';

const Dashboard: React.FC = () => {
  const [history, setHistory] = useState<ClassificationResult[]>([]);
  const [metrics, setMetrics] = useState<ClassificationMetrics | null>(null);
  const [modelStats, setModelStats] = useState(getModelStats());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getClassificationHistory();
        const metricsData = await getClassificationMetrics();
        setHistory(data);
        setMetrics(metricsData);
        setModelStats(getModelStats());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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
    },
    {
      label: 'Model Accuracy',
      value: `${(modelStats.accuracy * 100).toFixed(1)}%`,
      icon: <Brain size={18} className="text-blue-500" />,
      color: 'bg-blue-500/10'
    }
  ];
  
  // Prepare data for pie chart
  const sensitivityData = [
    { name: 'Sensitive', value: sensitiveFiles.length, color: '#ef4444' },
    { name: 'Non-Sensitive', value: nonSensitiveFiles.length, color: '#22c55e' }
  ];
  
  // Prepare data for encryption level chart
  const encryptionData = metrics ? [
    { name: 'Strongest', value: metrics.byEncryptionLevel['Strongest'] || 0, color: '#ef4444' },
    { name: 'Moderate', value: metrics.byEncryptionLevel['Moderate'] || 0, color: '#f97316' },
    { name: 'Basic', value: metrics.byEncryptionLevel['Basic'] || 0, color: '#22c55e' }
  ] : [];
  
  // Prepare data for file type bar chart
  const fileTypeData = metrics ? Object.entries(metrics.byFileType || {}).map(([type, count]) => ({
    name: type,
    value: count
  })) : [];
  
  // Colors for charts
  const CHART_COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6', '#d946ef'];
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <PieChart size={16} />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-1">
            <BarChart size={16} />
            <span>Detailed Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <File size={16} />
            <span>File History</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Sensitivity Distribution</CardTitle>
                <CardDescription>
                  Breakdown of sensitive vs non-sensitive files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={sensitivityData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {sensitivityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => [`${value} files`, 'Count']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Encryption Level Distribution</CardTitle>
                <CardDescription>
                  Files by required encryption level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={encryptionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {encryptionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => [`${value} files`, 'Count']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="glass-card mt-6">
            <CardHeader>
              <CardTitle className="text-base font-semibold">ML Model Performance</CardTitle>
              <CardDescription>
                Current model metrics and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-background/60 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">{(modelStats.accuracy * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-background/60 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Precision</p>
                  <p className="text-2xl font-bold">{(modelStats.precision * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-background/60 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Recall</p>
                  <p className="text-2xl font-bold">{(modelStats.recall * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-background/60 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">F1 Score</p>
                  <p className="text-2xl font-bold">{(modelStats.f1Score * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Model trained on {modelStats.trainingSamples} samples, tested on {modelStats.testingSamples} samples.</p>
                <p className="mt-1">Last trained: {modelStats.lastTrainedDate.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">File Type Analysis</CardTitle>
              <CardDescription>
                Number of files by document type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={fileTypeData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <RechartsTooltip formatter={(value) => [`${value} files`, 'Count']} />
                    <Legend />
                    <Bar dataKey="value" name="File Count" fill="#3b82f6">
                      {fileTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
