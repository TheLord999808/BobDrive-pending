'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { api, FileItem, FolderItem } from '@/lib/api';

interface FileContextType {
  // State
  currentFolder: FolderItem | null;
  files: FileItem[];
  folders: FolderItem[];
  loading: boolean;
  error: string | null;
  selectedItems: Set<string>;
  
  // Actions
  loadFileSystem: () => Promise<void>;
  loadFolderContents: (folderId: string) => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  uploadFile: (file: File, folderId?: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  moveFile: (fileId: string, targetFolderId?: string) => Promise<void>;
  moveFolder: (folderId: string, targetFolderId?: string) => Promise<void>;
  
  // Selection
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Navigation
  navigateToFolder: (folder: FolderItem | null) => void;
  navigateBack: () => void;
  
  // Utility
  refreshCurrentView: () => Promise<void>;
  setError: (error: string | null) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleError = useCallback((err: unknown) => {
    console.error('FileContext error:', err);
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    setError(errorMessage);
    setLoading(false);
  }, []);
    
  const loadFileSystem = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFileSystem();
      setFolders(data.folders);
      setFiles(data.files);
      setCurrentFolder(null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadFolderContents = useCallback(async (folderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFolderContents(folderId);
      setCurrentFolder(data.folder);
      setFolders(data.subfolders);
      setFiles(data.files);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createFolder = useCallback(async (name: string, parentId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const newFolder = await api.createFolder(name, parentId);
      setFolders(prev => [...prev, newFolder]);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const uploadFile = useCallback(async (file: File, folderId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const newFile = await api.uploadFile(file, folderId);
      setFiles(prev => [...prev, newFile]);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteFile = useCallback(async (fileId: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteFile(fileId);
      setFiles(prev => prev.filter(file => file.id !== fileId));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteFolder = useCallback(async (folderId: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteFolder(folderId);
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderId);
        return newSet;
      });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const renameFile = useCallback(async (fileId: string, newName: string) => {
    setLoading(true);
    setError(null);
    try {
      const updatedFile = await api.renameFile(fileId, newName);
      setFiles(prev => prev.map(file => 
        file.id === fileId ? updatedFile : file
      ));
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    setLoading(true);
    setError(null);
    try {
      const updatedFolder = await api.renameFolder(folderId, newName);
      setFolders(prev => prev.map(folder => 
        folder.id === folderId ? updatedFolder : folder
      ));
      if (currentFolder?.id === folderId) {
        setCurrentFolder(updatedFolder);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [currentFolder, handleError]);

  // Définition de refreshCurrentView avant son utilisation dans moveFile et moveFolder
  const refreshCurrentView = useCallback(async () => {
    if (currentFolder) {
      await loadFolderContents(currentFolder.id);
    } else {
      await loadFileSystem();
    }
  }, [currentFolder, loadFolderContents, loadFileSystem]);

  const moveFile = useCallback(async (fileId: string, targetFolderId?: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.moveFile(fileId, targetFolderId);
      // Refresh current view to reflect the move
      await refreshCurrentView();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError, refreshCurrentView]);

  const moveFolder = useCallback(async (folderId: string, targetFolderId?: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.moveFolder(folderId, targetFolderId);
      // Refresh current view to reflect the move
      await refreshCurrentView();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError, refreshCurrentView]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set([
      ...files.map(file => file.id),
      ...folders.map(folder => folder.id)
    ]);
    setSelectedItems(allIds);
  }, [files, folders]);

  const navigateToFolder = useCallback((folder: FolderItem | null) => {
    if (folder) {
      loadFolderContents(folder.id);
    } else {
      loadFileSystem();
    }
    clearSelection();
  }, [loadFolderContents, loadFileSystem, clearSelection]);

  const navigateBack = useCallback(() => {
    if (currentFolder?.parentId) {
      loadFolderContents(currentFolder.parentId);
    } else {
      loadFileSystem();
    }
    clearSelection();
  }, [currentFolder, loadFolderContents, loadFileSystem, clearSelection]);


  const value: FileContextType = {
    // State
    currentFolder,
    files,
    folders,
    loading,
    error,
    selectedItems,
    
    // Actions
    loadFileSystem,
    loadFolderContents,
    createFolder,
    uploadFile,
    deleteFile,
    deleteFolder,
    renameFile,
    renameFolder,
    moveFile,
    moveFolder,
    
    // Selection
    toggleSelection,
    clearSelection,
    selectAll,
    
    // Navigation
    navigateToFolder,
    navigateBack,
    
    // Utility
    refreshCurrentView,
    setError,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};