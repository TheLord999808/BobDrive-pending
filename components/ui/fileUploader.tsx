'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { useFileContext } from '@/context/FileContext';

interface FileUploadItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface FileUploaderProps {
  folderId?: string;
  onUploadComplete?: () => void;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  folderId,
  onUploadComplete,
  className = '',
}) => {
  const { uploadFile } = useFileContext();
  const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: FileUploadItem[] = acceptedFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      status: 'pending',
      progress: 0,
    }));

    setUploadQueue(prev => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    // Accept common file types
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
      'audio/*': ['.mp3', '.wav', '.aac', '.flac'],
      'text/*': ['.txt', '.md', '.csv'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFromQueue = useCallback((id: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const startUpload = useCallback(async () => {
    if (isUploading || uploadQueue.length === 0) return;

    setIsUploading(true);

    for (const item of uploadQueue) {
      if (item.status !== 'pending') continue;

      try {
        // Update status to uploading
        setUploadQueue(prev => 
          prev.map(qItem => 
            qItem.id === item.id 
              ? { ...qItem, status: 'uploading', progress: 0 }
              : qItem
          )
        );

        // Simulate upload progress (in real implementation, this would come from the API)
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadQueue(prev => 
            prev.map(qItem => 
              qItem.id === item.id 
                ? { ...qItem, progress }
                : qItem
            )
          );
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Actual upload
        await uploadFile(item.file, folderId);

        // Mark as success
        setUploadQueue(prev => 
          prev.map(qItem => 
            qItem.id === item.id 
              ? { ...qItem, status: 'success', progress: 100 }
              : qItem
          )
        );

      } catch (error) {
        // Mark as error
        setUploadQueue(prev => 
          prev.map(qItem => 
            qItem.id === item.id 
              ? { 
                  ...qItem, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : qItem
          )
        );
      }
    }

    setIsUploading(false);
    onUploadComplete?.();

    // Clear successful uploads after a delay
    setTimeout(() => {
      setUploadQueue(prev => prev.filter(item => item.status !== 'success'));
    }, 2000);
  }, [isUploading, uploadQueue, uploadFile, folderId, onUploadComplete]);

  const clearQueue = useCallback(() => {
    setUploadQueue([]);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {isDragActive 
            ? 'Drop files here...' 
            : 'Drop files here or click to select'
          }
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Support for images, videos, audio, documents, and text files up to 10MB
        </p>
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Upload Queue ({uploadQueue.length})
            </h3>
            <div className="space-x-2">
              <Button
                onClick={startUpload}
                disabled={isUploading || uploadQueue.every(item => item.status !== 'pending')}
                size="sm"
              >
                {isUploading ? 'Uploading...' : 'Start Upload'}
              </Button>
              <Button
                onClick={clearQueue}
                variant="outline"
                size="sm"
                disabled={isUploading}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <File className="h-5 w-5 text-gray-500" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(item.file.size)}
                  </p>
                  
                  {item.status === 'uploading' && (
                    <Progress value={item.progress} className="mt-1" />
                  )}
                  
                  {item.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1">{item.error}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {item.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  
                  <Button
                    onClick={() => removeFromQueue(item.id)}
                    variant="ghost"
                    size="sm"
                    disabled={item.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};