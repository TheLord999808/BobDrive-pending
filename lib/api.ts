const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface FileItem {
  id: string;
  name: string;
  type: string;
  mimetype: string;
  size: number;
  path: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children?: FolderItem[];
  files?: FileItem[];
}

export interface FileSystemResponse {
  folders: FolderItem[];
  files: FileItem[];
}

export interface FolderContentsResponse {
  folder: FolderItem;
  subfolders: FolderItem[];
  files: FileItem[];
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// File System API calls
export const api = {
  // Get root file system
  getFileSystem: async (): Promise<FileSystemResponse> => {
    const response = await fetch(`${API_BASE_URL}/files`);
    return handleResponse(response);
  },

  // Get folder contents
  getFolderContents: async (folderId: string): Promise<FolderContentsResponse> => {
    const response = await fetch(`${API_BASE_URL}/folders/${folderId}`);
    return handleResponse(response);
  },

  // Create new folder
  createFolder: async (name: string, parentId?: string): Promise<FolderItem> => {
    const response = await fetch(`${API_BASE_URL}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, parentId }),
    });
    return handleResponse(response);
  },

  // Upload file
  uploadFile: async (file: File, folderId?: string): Promise<FileItem> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    const response = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  // Delete file
  deleteFile: async (fileId: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Delete folder
  deleteFolder: async (folderId: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Rename file
  renameFile: async (fileId: string, newName: string): Promise<FileItem> => {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/rename`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newName }),
    });
    return handleResponse(response);
  },

  // Rename folder
  renameFolder: async (folderId: string, newName: string): Promise<FolderItem> => {
    const response = await fetch(`${API_BASE_URL}/folders/${folderId}/rename`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newName }),
    });
    return handleResponse(response);
  },

  // Move file
  moveFile: async (fileId: string, targetFolderId?: string): Promise<FileItem> => {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/move`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetFolderId }),
    });
    return handleResponse(response);
  },

  // Move folder
  moveFolder: async (folderId: string, targetFolderId?: string): Promise<FolderItem> => {
    const response = await fetch(`${API_BASE_URL}/folders/${folderId}/move`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetFolderId }),
    });
    return handleResponse(response);
  },
};

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

export const getFileIcon = (type: string): string => {
  switch (type) {
    case 'image':
      return '🖼️';
    case 'video':
      return '🎬';
    case 'audio':
      return '🎵';
    case 'document':
      return '📄';
    case 'text':
      return '📝';
    default:
      return '📁';
  }
};

export const isImageFile = (mimetype: string): boolean => {
  return mimetype.startsWith('image/');
};

export const isVideoFile = (mimetype: string): boolean => {
  return mimetype.startsWith('video/');
};

export const isAudioFile = (mimetype: string): boolean => {
  return mimetype.startsWith('audio/');
};

export const isDocumentFile = (mimetype: string): boolean => {
  return mimetype.includes('pdf') || 
         mimetype.includes('word') || 
         mimetype.includes('excel') || 
         mimetype.includes('powerpoint');
};