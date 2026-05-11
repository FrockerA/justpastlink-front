import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideos } from '@/hooks/useVideos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileVideo, X, CheckCircle, Youtube, LinkIcon, Loader2 } from 'lucide-react';

interface VideoUploadProps {
  onUploadSuccess?: () => void;
}

type UploadMode = 'youtube' | 'file';

interface UploadErrorLike {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

function isValidYoutubeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.replace(/^www\./, '');

    return (
      hostname === 'youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'youtu.be' ||
      hostname === 'youtube-nocookie.com'
    );
  } catch {
    return false;
  }
}

function isUploadErrorLike(err: unknown): err is UploadErrorLike {
  return typeof err === 'object' && err !== null;
}

function getUploadError(err: unknown, fallback: string) {
  if (!isUploadErrorLike(err)) {
    return fallback;
  }

  return err.response?.data?.detail || err.message || fallback;
}

export function VideoUpload({ onUploadSuccess }: VideoUploadProps) {
  const { uploadVideo, uploadYoutubeVideo } = useVideos();
  const navigate = useNavigate();
  const [uploadMode, setUploadMode] = useState<UploadMode>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleModeChange = (value: string) => {
    if (isUploading) return;
    setUploadMode(value as UploadMode);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video file');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setUploadError('File size must be less than 500MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const openVideo = (videoId: number) => {
    onUploadSuccess?.();
    navigate(`/videos/${videoId}?tab=status`);
  };

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUrl = youtubeUrl.trim();
    if (!isValidYoutubeUrl(trimmedUrl)) {
      setUploadError('Paste a valid YouTube link');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const uploadedVideo = await uploadYoutubeVideo(trimmedUrl);
      setUploadSuccess(true);
      setYoutubeUrl('');
      openVideo(uploadedVideo.id);
    } catch (err) {
      setUploadError(getUploadError(err, 'Failed to process YouTube link'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const uploadedVideo = await uploadVideo(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadSuccess(true);
      setSelectedFile(null);
      openVideo(uploadedVideo.id);
    } catch (err) {
      setUploadError(getUploadError(err, 'Failed to upload video'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Video</CardTitle>
        <CardDescription>
          Paste a YouTube link or upload a local video file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Video added successfully. Processing has started.
            </AlertDescription>
          </Alert>
        )}

        {uploadError && (
          <Alert variant="destructive">
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        <Tabs value={uploadMode} onValueChange={handleModeChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="youtube" disabled={isUploading}>
              <Youtube className="mr-2 h-4 w-4" />
              YouTube
            </TabsTrigger>
            <TabsTrigger value="file" disabled={isUploading}>
              <Upload className="mr-2 h-4 w-4" />
              File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="youtube" className="space-y-4">
            <form className="space-y-4" onSubmit={handleYoutubeSubmit}>
              <div className="space-y-2">
                <Label htmlFor="youtube-url">YouTube link</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="youtube-url"
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => {
                        setYoutubeUrl(e.target.value);
                        setUploadError(null);
                        setUploadSuccess(false);
                      }}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="pl-9"
                      disabled={isUploading}
                    />
                  </div>
                  <Button type="submit" disabled={isUploading || !youtubeUrl.trim()} className="sm:w-44">
                    {isUploading && uploadMode === 'youtube' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Youtube className="mr-2 h-4 w-4" />
                    )}
                    Process Link
                  </Button>
                </div>
              </div>

              {isUploading && uploadMode === 'youtube' && (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Downloading from YouTube and starting the pipeline...
                  </div>
                </div>
              )}
            </form>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Drag and drop your video</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse files
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="video-upload"
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('video-upload')?.click()}
                    disabled={isUploading}
                  >
                    Select File
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: MP4, AVI, MOV, MKV (max 500MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <FileVideo className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearSelection}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {isUploading && uploadMode === 'file' && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-center text-muted-foreground">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}

                {!isUploading && (
                  <Button onClick={handleUpload} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Video
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
