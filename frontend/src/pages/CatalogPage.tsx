import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BookOpen,
  FilePlus2,
  Folder,
  FolderOpen,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCatalogs } from '@/hooks/useCatalogs';
import { useVideos } from '@/hooks/useVideos';
import { getApiErrorDetail } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Catalog } from '@/types';

type CatalogDialogMode = 'create' | 'rename';

export function CatalogPage() {
  const {
    catalogs,
    isLoading,
    error,
    createCatalog,
    renameCatalog,
    deleteCatalog,
    addLecture,
    removeLecture,
  } = useCatalogs();
  const { videos, isLoading: videosLoading } = useVideos();
  const [selectedCatalogId, setSelectedCatalogId] = useState<number | null>(null);
  const [catalogDialogMode, setCatalogDialogMode] = useState<CatalogDialogMode>('create');
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [catalogName, setCatalogName] = useState('');
  const [addLectureDialogOpen, setAddLectureDialogOpen] = useState(false);
  const [catalogToDelete, setCatalogToDelete] = useState<Catalog | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingVideoId, setPendingVideoId] = useState<number | null>(null);
  const [lectureSearch, setLectureSearch] = useState('');

  useEffect(() => {
    if (catalogs.length === 0) {
      setSelectedCatalogId(null);
      return;
    }

    const selectedStillExists = catalogs.some((catalog) => catalog.id === selectedCatalogId);
    if (!selectedStillExists) {
      setSelectedCatalogId(catalogs[0].id);
    }
  }, [catalogs, selectedCatalogId]);

  const selectedCatalog = useMemo(
    () => catalogs.find((catalog) => catalog.id === selectedCatalogId) ?? null,
    [catalogs, selectedCatalogId]
  );

  const availableVideos = useMemo(() => {
    const assignedVideoIds = new Set(
      selectedCatalog?.lectures.map((lecture) => lecture.video_id) ?? []
    );
    return videos.filter(
      (video) => video.status === 'completed' && !assignedVideoIds.has(video.id)
    );
  }, [selectedCatalog, videos]);

  const filteredAvailableVideos = useMemo(() => {
    const query = lectureSearch.trim().toLocaleLowerCase();
    if (!query) return availableVideos;

    return availableVideos.filter((video) =>
      video.original_filename.toLocaleLowerCase().includes(query)
    );
  }, [availableVideos, lectureSearch]);

  const handleAddLectureDialogChange = (open: boolean) => {
    setAddLectureDialogOpen(open);
    if (!open) {
      setLectureSearch('');
    }
  };

  const openCreateDialog = () => {
    setCatalogDialogMode('create');
    setCatalogName('');
    setCatalogDialogOpen(true);
  };

  const openRenameDialog = (catalog: Catalog) => {
    setCatalogDialogMode('rename');
    setCatalogName(catalog.name);
    setSelectedCatalogId(catalog.id);
    setCatalogDialogOpen(true);
  };

  const handleCatalogSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = catalogName.trim();
    if (!normalizedName) return;

    setIsSaving(true);
    try {
      if (catalogDialogMode === 'create') {
        const created = await createCatalog(normalizedName);
        setSelectedCatalogId(created.id);
        toast.success('Folder created');
      } else if (selectedCatalog) {
        await renameCatalog(selectedCatalog.id, normalizedName);
        toast.success('Folder renamed');
      }
      setCatalogDialogOpen(false);
      setCatalogName('');
    } catch (requestError) {
      toast.error(getApiErrorDetail(requestError, 'Failed to save folder'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCatalog = async () => {
    if (!catalogToDelete) return;

    setIsSaving(true);
    try {
      await deleteCatalog(catalogToDelete.id);
      toast.success('Folder deleted');
      setCatalogToDelete(null);
    } catch (requestError) {
      toast.error(getApiErrorDetail(requestError, 'Failed to delete folder'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLecture = async (videoId: number) => {
    if (!selectedCatalog) return;

    setPendingVideoId(videoId);
    try {
      await addLecture(selectedCatalog.id, videoId);
      toast.success('Lecture added to folder');
    } catch (requestError) {
      toast.error(getApiErrorDetail(requestError, 'Failed to add lecture'));
    } finally {
      setPendingVideoId(null);
    }
  };

  const handleRemoveLecture = async (videoId: number) => {
    if (!selectedCatalog) return;

    setPendingVideoId(videoId);
    try {
      await removeLecture(selectedCatalog.id, videoId);
      toast.success('Lecture removed from folder');
    } catch (requestError) {
      toast.error(getApiErrorDetail(requestError, 'Failed to remove lecture'));
    } finally {
      setPendingVideoId(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catalog</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize processed lectures into folders by topic
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            New Folder
          </Button>
        </div>

        {error && (
          <Card className="border-destructive/40">
            <CardContent className="p-6 text-sm text-destructive">
              Failed to load folders. Please refresh the page.
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Folders
              </CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${catalogs.length} total`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading &&
                [1, 2, 3].map((item) => <Skeleton key={item} className="h-12 w-full" />)}

              {!isLoading && !error && catalogs.length === 0 && (
                <div className="rounded-md border border-dashed p-5 text-center">
                  <p className="text-sm font-medium">Нет созданных папок</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={openCreateDialog}
                  >
                    <Plus className="h-4 w-4" />
                    Создать папку
                  </Button>
                </div>
              )}

              {catalogs.map((catalog) => (
                <div
                  key={catalog.id}
                  className={cn(
                    'flex items-center rounded-md border transition-colors',
                    selectedCatalogId === catalog.id
                      ? 'border-primary/30 bg-primary/10'
                      : 'hover:bg-accent'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCatalogId(catalog.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
                  >
                    {selectedCatalogId === catalog.id ? (
                      <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {catalog.name}
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {catalog.lectures.length}
                    </Badge>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="mr-1 h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Folder actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openRenameDialog(catalog)}>
                        <Pencil className="h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setCatalogToDelete(catalog)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="min-h-[420px]">
            {!selectedCatalog ? (
              <CardContent className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
                <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h2 className="text-lg font-semibold">Нет созданных папок</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Создайте папку для программирования, химии, языков или другой темы.
                </p>
                <Button className="mt-5" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4" />
                  Создать папку
                </Button>
              </CardContent>
            ) : (
              <>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      <span className="truncate">{selectedCatalog.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {selectedCatalog.lectures.length} lecture
                      {selectedCatalog.lectures.length === 1 ? '' : 's'}
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleAddLectureDialogChange(true)}>
                    <FilePlus2 className="h-4 w-4" />
                    Add Lectures
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedCatalog.lectures.length === 0 && (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                      <p className="font-medium">This folder is empty</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add processed lectures to organize them by topic.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => handleAddLectureDialogChange(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Add Lectures
                      </Button>
                    </div>
                  )}

                  {selectedCatalog.lectures.map((lecture) => (
                    <div
                      key={lecture.video_id}
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                    >
                      <div className="rounded-md bg-primary/10 p-2.5">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <Link
                        to={`/videos/${lecture.video_id}?tab=lecture`}
                        className="min-w-0 flex-1"
                      >
                        <p className="truncate text-sm font-medium">{lecture.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {lecture.video_title}
                        </p>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={pendingVideoId === lecture.video_id}
                        onClick={() => void handleRemoveLecture(lecture.video_id)}
                      >
                        {pendingVideoId === lecture.video_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        <span className="sr-only">Remove from folder</span>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={catalogDialogOpen} onOpenChange={setCatalogDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCatalogSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {catalogDialogMode === 'create' ? 'Create Folder' : 'Rename Folder'}
              </DialogTitle>
              <DialogDescription>
                Use a topic such as Programming, Chemistry, or Languages.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="catalog-name">Folder name</Label>
              <Input
                id="catalog-name"
                value={catalogName}
                onChange={(event) => setCatalogName(event.target.value)}
                maxLength={100}
                autoFocus
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCatalogDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !catalogName.trim()}>
                {isSaving ? 'Saving...' : catalogDialogMode === 'create' ? 'Create' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addLectureDialogOpen} onOpenChange={handleAddLectureDialogChange}>
        <DialogContent className="flex max-h-[min(760px,calc(100vh-2rem))] w-[calc(100%-2rem)] max-w-2xl min-w-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b px-6 py-5 pr-12">
            <DialogTitle>Add Lectures</DialogTitle>
            <DialogDescription>
              Choose processed lectures for {selectedCatalog?.name ?? 'this folder'}.
            </DialogDescription>
          </DialogHeader>

          <div className="shrink-0 border-b px-6 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={lectureSearch}
                onChange={(event) => setLectureSearch(event.target.value)}
                placeholder="Search lectures by title..."
                className="pl-9"
                aria-label="Search lectures by title"
              />
            </div>
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="min-w-0 space-y-2 px-6 py-4">
              {videosLoading && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading lectures...
                </div>
              )}

              {!videosLoading && availableVideos.length === 0 && (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <Video className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
                  <p className="text-sm font-medium">No lectures available</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    All processed lectures are already in this folder, or processing is not complete.
                  </p>
                </div>
              )}

              {!videosLoading &&
                availableVideos.length > 0 &&
                filteredAvailableVideos.length === 0 && (
                  <div className="rounded-md border border-dashed p-8 text-center">
                    <Search className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No lectures found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Try another title or clear the search.
                    </p>
                  </div>
                )}

              {filteredAvailableVideos.map((video) => (
                <div
                  key={video.id}
                  className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border p-3"
                >
                  <div className="shrink-0 rounded-md bg-muted p-2">
                    <Video className="h-4 w-4" />
                  </div>
                  <p
                    className="min-w-0 flex-1 truncate text-sm font-medium"
                    title={video.original_filename}
                  >
                    {video.original_filename}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    disabled={pendingVideoId === video.id}
                    onClick={() => void handleAddLecture(video.id)}
                  >
                    {pendingVideoId === video.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button variant="outline" onClick={() => handleAddLectureDialogChange(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(catalogToDelete)}
        onOpenChange={(open) => !open && setCatalogToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              The folder "{catalogToDelete?.name}" will be deleted. Its lectures and videos will
              remain in your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteCatalog()}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
