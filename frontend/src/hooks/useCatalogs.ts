import { useCallback, useEffect, useState } from 'react';
import { catalogsApi } from '@/lib/api';
import type { Catalog } from '@/types';

export function useCatalogs() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCatalogs(await catalogsApi.getCatalogs());
    } catch {
      setError('Failed to fetch catalogs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCatalogs();
  }, [fetchCatalogs]);

  const replaceCatalog = (updated: Catalog) => {
    setCatalogs((current) =>
      current.map((catalog) => (catalog.id === updated.id ? updated : catalog))
    );
    return updated;
  };

  const createCatalog = async (name: string) => {
    const created = await catalogsApi.createCatalog(name);
    setError(null);
    setCatalogs((current) => [...current, created]);
    return created;
  };

  const renameCatalog = async (catalogId: number, name: string) => {
    return replaceCatalog(await catalogsApi.renameCatalog(catalogId, name));
  };

  const deleteCatalog = async (catalogId: number) => {
    await catalogsApi.deleteCatalog(catalogId);
    setCatalogs((current) => current.filter((catalog) => catalog.id !== catalogId));
  };

  const addLecture = async (catalogId: number, videoId: number) => {
    return replaceCatalog(await catalogsApi.addLecture(catalogId, videoId));
  };

  const removeLecture = async (catalogId: number, videoId: number) => {
    return replaceCatalog(await catalogsApi.removeLecture(catalogId, videoId));
  };

  return {
    catalogs,
    isLoading,
    error,
    fetchCatalogs,
    createCatalog,
    renameCatalog,
    deleteCatalog,
    addLecture,
    removeLecture,
  };
}
