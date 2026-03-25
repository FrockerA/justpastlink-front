import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { VideoUpload } from '@/components/video/VideoUpload';
import { VideoList } from '@/components/video/VideoList';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useVideos } from '@/hooks/useVideos';

export function DashboardPage() {
  const [showUpload, setShowUpload] = useState(false);
  const { fetchVideos } = useVideos();

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchVideos();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your videos and learning materials
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchVideos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowUpload(!showUpload)}>
              {showUpload ? (
                <>
                  <Plus className="h-4 w-4 mr-2 rotate-45" />
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
          <VideoUpload onUploadSuccess={handleUploadSuccess} />
        )}

        {/* Video List */}
        <VideoList onRefresh={fetchVideos} />
      </div>
    </MainLayout>
  );
}
