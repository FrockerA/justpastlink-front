import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { VideoUpload } from '@/components/video/VideoUpload';
import { VideoList } from '@/components/video/VideoList';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useVideos } from '@/hooks/useVideos';
import { cn } from '@/lib/utils';

export function DashboardPage() {
  const [showUpload, setShowUpload] = useState(false);
  const { fetchVideos, isLoading } = useVideos();

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchVideos();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Videos</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage your videos and learning materials
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={fetchVideos}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={() => setShowUpload(!showUpload)}>
              {showUpload ? (
                <>
                  <Plus className="h-4 w-4 mr-2 rotate-45 transition-transform" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <VideoUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* Video List */}
        <VideoList onRefresh={fetchVideos} />
      </div>
    </MainLayout>
  );
}
