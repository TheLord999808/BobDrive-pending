"use client"

import { useState, useCallback, useRef } from "react"
import {
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  Folder,
  FolderOpen,
  Image,
  MoreVertical,
  Music,
  Video,
  Upload,
  FolderPlus,
  Trash2,
  Download,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface FileItem {
  name: string
  type: 'folder' | 'document' | 'image' | 'video' | 'audio' | 'text' | 'file'
  size?: string
  modified: string
  file?: File
  children?: FileItem[]
  id: string
}

export default function RealFileManager() {
  const [fileSystem, setFileSystem] = useState<FileItem>({
    name: "Mes Fichiers",
    type: "folder",
    children: [],
    modified: new Date().toISOString().split('T')[0],
    id: "root"
  })
  
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["root"])
  const [currentFolder, setCurrentFolder] = useState<FileItem>(fileSystem)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([fileSystem.name])
  const [isDragging, setIsDragging] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const getFileType = (file: File): FileItem['type'] => {
    const mimeType = file.type
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('text') || ['txt', 'md', 'json', 'xml'].includes(extension || '')) return 'text'
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '')) return 'document'
    
    return 'file'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const addFilesToFolder = useCallback((files: FileList | File[], targetFolder: FileItem) => {
    const newFiles: FileItem[] = Array.from(files).map(file => ({
      name: file.name,
      type: getFileType(file),
      size: formatFileSize(file.size),
      modified: new Date(file.lastModified).toISOString().split('T')[0],
      file: file,
      id: generateId()
    }))

    const updatedFolder = {
      ...targetFolder,
      children: [...(targetFolder.children || []), ...newFiles]
    }

    // Mettre à jour le système de fichiers
    const updateFileSystem = (node: FileItem): FileItem => {
      if (node.id === targetFolder.id) {
        return updatedFolder
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateFileSystem)
        }
      }
      return node
    }

    const newFileSystem = updateFileSystem(fileSystem)
    setFileSystem(newFileSystem)
    
    // Mettre à jour le dossier courant si c'est celui qui a été modifié
    if (currentFolder.id === targetFolder.id) {
      setCurrentFolder(updatedFolder)
    }
  }, [fileSystem, currentFolder])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      addFilesToFolder(files, currentFolder)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      // Organiser les fichiers par dossier
      const folderStructure: { [key: string]: File[] } = {}
      
      Array.from(files).forEach(file => {
        const pathParts = file.webkitRelativePath.split('/')
        const folderName = pathParts[0]
        
        if (!folderStructure[folderName]) {
          folderStructure[folderName] = []
        }
        folderStructure[folderName].push(file)
      })

      // Créer les dossiers et ajouter les fichiers
      const newFolders: FileItem[] = Object.entries(folderStructure).map(([folderName, folderFiles]) => ({
        name: folderName,
        type: 'folder' as const,
        modified: new Date().toISOString().split('T')[0],
        id: generateId(),
        children: folderFiles.map(file => ({
          name: file.name.split('/').pop() || file.name,
          type: getFileType(file),
          size: formatFileSize(file.size),
          modified: new Date(file.lastModified).toISOString().split('T')[0],
          file: file,
          id: generateId()
        }))
      }))

      const updatedFolder = {
        ...currentFolder,
        children: [...(currentFolder.children || []), ...newFolders]
      }

      // Même logique de mise à jour que pour les fichiers
      const updateFileSystem = (node: FileItem): FileItem => {
        if (node.id === currentFolder.id) {
          return updatedFolder
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateFileSystem)
          }
        }
        return node
      }

      const newFileSystem = updateFileSystem(fileSystem)
      setFileSystem(newFileSystem)
      setCurrentFolder(updatedFolder)
    }
    
    // Reset input
    if (folderInputRef.current) {
      folderInputRef.current.value = ''
    }
  }

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      addFilesToFolder(files, currentFolder)
    }
  }, [addFilesToFolder, currentFolder])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const downloadFile = (fileItem: FileItem) => {
    if (fileItem.file) {
      const url = URL.createObjectURL(fileItem.file)
      const a = document.createElement('a')
      a.href = url
      a.download = fileItem.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const deleteItem = (itemToDelete: FileItem) => {
    const updateFileSystem = (node: FileItem): FileItem => {
      if (node.children) {
        return {
          ...node,
          children: node.children.filter(child => child.id !== itemToDelete.id)
        }
      }
      return node
    }

    const newFileSystem = updateFileSystem(fileSystem)
    setFileSystem(newFileSystem)
    
    // Mettre à jour le dossier courant
    if (currentFolder.children) {
      const updatedCurrentFolder = {
        ...currentFolder,
        children: currentFolder.children.filter(child => child.id !== itemToDelete.id)
      }
      setCurrentFolder(updatedCurrentFolder)
    }
    
    // Désélectionner si l'élément supprimé était sélectionné
    if (selectedFile?.id === itemToDelete.id) {
      setSelectedFile(null)
    }
  }

  const toggleFolder = (folderPath: string) => {
    if (expandedFolders.includes(folderPath)) {
      setExpandedFolders(expandedFolders.filter((path) => path !== folderPath))
    } else {
      setExpandedFolders([...expandedFolders, folderPath])
    }
  }

  const navigateToFolder = (folder: FileItem, path: string[]) => {
    setCurrentFolder(folder)
    setBreadcrumbs(path)
    setSelectedFile(null)
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "folder":
        return <Folder className="h-4 w-4" />
      case "document":
        return <FileText className="h-4 w-4" />
      case "image":
        return <Image className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const findFolderByPath = (path: string[]): FileItem => {
    let currentNode = fileSystem
    
    for (let i = 1; i < path.length; i++) {
      const folderName = path[i]
      const folder = currentNode.children?.find(
        (c: FileItem) => c.name === folderName && c.type === "folder"
      )
      if (folder) {
        currentNode = folder
      } else {
        break
      }
    }
    
    return currentNode
  }

  const renderTree = (node: FileItem, path: string[] = []) => {
    const currentPath = [...path, node.name]
    const isExpanded = expandedFolders.includes(node.id)

    if (node.type === "folder") {
      return (
        <div key={node.id}>
          <div
            className={cn(
              "flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-muted",
              currentFolder.id === node.id && "bg-muted",
            )}
            onClick={() => {
              toggleFolder(node.id)
              navigateToFolder(node, currentPath)
            }}
          >
            <span className="text-muted-foreground">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
            <span className="text-amber-500">
              {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
            </span>
            <span className="text-sm">{node.name}</span>
          </div>

          {isExpanded && node.children && (
            <div className="pl-4">{node.children.map((child: FileItem) => renderTree(child, currentPath))}</div>
          )}
        </div>
      )
    }

    return (
      <div
        key={node.id}
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-muted ml-6",
          selectedFile?.id === node.id && "bg-muted",
        )}
        onClick={() => setSelectedFile(node)}
      >
        <span className="text-muted-foreground">{getFileIcon(node.type)}</span>
        <span className="text-sm">{node.name}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Gestionnaire de Fichiers</h2>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFolderUpload}
            webkitdirectory=""
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => folderInputRef.current?.click()}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Dossier
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Fichiers
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/30 hidden md:block">
          <ScrollArea className="h-full p-2">{renderTree(fileSystem)}</ScrollArea>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 p-2 border-b bg-muted/30 overflow-x-auto">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2"
                  onClick={() => {
                    const targetPath = breadcrumbs.slice(0, index + 1)
                    const targetFolder = findFolderByPath(targetPath)
                    navigateToFolder(targetFolder, targetPath)
                  }}
                >
                  {crumb}
                </Button>
              </div>
            ))}
          </div>

          {/* File list */}
          <div 
            className={cn(
              "flex-1 overflow-auto p-4 transition-colors",
              isDragging && "bg-blue-50 border-2 border-dashed border-blue-300"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {(!currentFolder.children || currentFolder.children.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Upload className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun fichier</h3>
                <p className="text-muted-foreground mb-4">
                  Glissez-déposez des fichiers ici ou utilisez les boutons ci-dessus
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter des fichiers
                  </Button>
                  <Button variant="outline" onClick={() => folderInputRef.current?.click()}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Ajouter un dossier
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentFolder.children.map((item: FileItem) => (
                  <Card
                    key={item.id}
                    className={cn(
                      "cursor-pointer hover:border-primary/50 transition-colors",
                      selectedFile?.id === item.id && "border-primary",
                    )}
                    onClick={() => {
                      if (item.type === "folder") {
                        navigateToFolder(item, [...breadcrumbs, item.name])
                        if (!expandedFolders.includes(item.id)) {
                          setExpandedFolders([...expandedFolders, item.id])
                        }
                      } else {
                        setSelectedFile(item)
                      }
                    }}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                      <div className="relative">
                        <div className="h-16 w-16 flex items-center justify-center">
                          {item.type === "folder" ? (
                            <Folder className="h-16 w-16 text-amber-500" />
                          ) : item.type === "image" ? (
                            <Image className="h-16 w-16 text-green-500" />
                          ) : item.type === "video" ? (
                            <Video className="h-16 w-16 text-purple-500" />
                          ) : item.type === "audio" ? (
                            <Music className="h-16 w-16 text-red-500" />
                          ) : (
                            <FileText className="h-16 w-16 text-sky-500" />
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {item.type !== "folder" && (
                              <DropdownMenuItem onClick={() => downloadFile(item)}>
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteItem(item)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium truncate max-w-[120px]" title={item.name}>
                          {item.name}
                        </p>
                        {item.type !== "folder" && item.size && (
                          <p className="text-xs text-muted-foreground">{item.size}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Preview panel */}
          {selectedFile && (
            <div className="border-t p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{selectedFile.name}</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadFile(selectedFile)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p>{selectedFile.type.charAt(0).toUpperCase() + selectedFile.type.slice(1)}</p>
                </div>
                {selectedFile.size && (
                  <div>
                    <p className="text-muted-foreground">Taille</p>
                    <p>{selectedFile.size}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Modifié</p>
                  <p>{selectedFile.modified}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}