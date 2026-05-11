import { useState } from 'react';
import { useLecture } from '@/hooks/useLecture';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextBlock } from '@/components/content/RichTextBlock';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  RefreshCw, 
  Edit2, 
  Save, 
  X,
  FileText,
  ListChecks,
  Sparkles
} from 'lucide-react';

interface LectureViewProps {
  videoId: number;
}

export function LectureView({ videoId }: LectureViewProps) {
  const { lecture, isLoading, error, fetchLecture, updateLecture } = useLecture(videoId);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const summaryText = lecture?.summary?.trim() ?? '';

  const handleEdit = () => {
    if (lecture) {
      setEditedTitle(lecture.title ?? "");
      setEditedContent(lecture.content);
      setEditedSummary(lecture.summary ?? "");
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateLecture({
        title: editedTitle,
        content: editedContent,
        summary: editedSummary,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedContent('');
    setEditedSummary('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchLecture}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!lecture) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lecture
          </CardTitle>
          <CardDescription>
            Lecture is not available yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>The lecture will be generated once transcription is complete</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-md">
                  <Sparkles className="h-3 w-3" />
                  AI lecture
                </Badge>
                {lecture.status && (
                  <Badge variant="outline" className="rounded-md capitalize">
                    {lecture.status}
                  </Badge>
                )}
              </div>
              <CardTitle className="flex items-start gap-2 text-xl leading-tight tracking-normal">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0" />
                <span className="break-words">{lecture.title || 'Untitled Lecture'}</span>
              </CardTitle>
              <CardDescription>
                Generated lecture from your video
              </CardDescription>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {summaryText && (
            <div className="border-b bg-background px-5 py-5 md:px-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-normal">
                <ListChecks className="h-4 w-4 text-primary" />
                Key takeaways
              </div>
              <RichTextBlock text={summaryText} dense />
            </div>
          )}

          <Tabs defaultValue="content" className="w-full p-5 md:p-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Lecture
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Summary
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="mt-4">
              <ScrollArea className="h-[560px] w-full rounded-md border bg-background">
                <div className="px-5 py-5 md:px-6">
                  <RichTextBlock text={lecture.content} />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="summary" className="mt-4">
              <ScrollArea className="h-[360px] w-full rounded-md border bg-muted/20">
                <div className="px-5 py-5 md:px-6">
                  <RichTextBlock text={summaryText} emptyText="No summary available" dense />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Lecture</DialogTitle>
            <DialogDescription>
              Make changes to the lecture content
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Lecture title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Lecture content"
                className="min-h-[200px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                placeholder="Lecture summary"
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
