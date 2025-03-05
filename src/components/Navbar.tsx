
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { FileLock, Upload, LayoutDashboard, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  onTabChange, 
  toggleDarkMode, 
  isDarkMode 
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <FileLock className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">MetaShield</span>
        </div>
        
        <div className="flex-1 flex justify-center">
          <Tabs value={activeTab} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="upload" 
                onClick={() => onTabChange('upload')}
                className={cn(
                  "flex items-center gap-1",
                  activeTab === 'upload' ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Upload size={16} />
                <span>Upload</span>
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                onClick={() => onTabChange('dashboard')}
                className={cn(
                  "flex items-center gap-1",
                  activeTab === 'dashboard' ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleDarkMode}
            className="rounded-full"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
