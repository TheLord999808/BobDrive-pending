"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  Folder,
  FolderOpen,
  ImageIcon,
  MoreVertical,
  Music,
  Video,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// Sample file system data
const fileSystem = {
  name: "My Files",
  type: "folder",
  children: [
    {
      name: "Documents",
      type: "folder",
      children: [
        { name: "Project Proposal.docx", type: "document", size: "245 KB", modified: "2023-10-15" },
        { name: "Meeting Notes.txt", type: "text", size: "12 KB", modified: "2023-10-20" },
        { name: "Budget.xlsx", type: "document", size: "154 KB", modified: "2023-10-18" },
      ],
    },
    {
      name: "Images",
      type: "folder",
      children: [
        { name: "Vacation.jpg", type: "image", size: "3.2 MB", modified: "2023-09-05" },
        { name: "Profile.png", type: "image", size: "1.8 MB", modified: "2023-09-10" },
        { name: "Screenshot.png", type: "image", size: "856 KB", modified: "2023-10-01" },
      ],
    },
    {
      name: "Videos",
      type: "folder",
      children: [
        { name: "Presentation.mp4", type: "video", size: "24.5 MB", modified: "2023-08-12" },
        { name: "Tutorial.mp4", type: "video", size: "18.2 MB", modified: "2023-08-15" },
      ],
    },
    {
      name: "Music",
      type: "folder",
      children: [
        { name: "Song1.mp3", type: "audio", size: "4.5 MB", modified: "2023-07-20" },
        { name: "Song2.mp3", type: "audio", size: "3.8 MB", modified: "2023-07-22" },
        { name: "Song3.mp3", type: "audio", size: "4.2 MB", modified: "2023-07-25" },
      ],
    },
    { name: "Notes.txt", type: "text", size: "8 KB", modified: "2023-10-22" },
    { name: "Report.pdf", type: "document", size: "1.2 MB", modified: "2023-10-10" },
  ],
}

export default function FileManager() {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["My Files"])
  const [currentFolder, setCurrentFolder] = useState<any>(fileSystem)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([fileSystem.name])

  const toggleFolder = (folderPath: string) => {
    if (expandedFolders.includes(folderPath)) {
      setExpandedFolders(expandedFolders.filter((path) => path !== folderPath))
    } else {
      setExpandedFolders([...expandedFolders, folderPath])
    }
  }

  const navigateToFolder = (folder: any, path: string[]) => {
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
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const renderTree = (node: any, path: string[] = []) => {
    const currentPath = [...path, node.name]
    const isExpanded = expandedFolders.includes(currentPath.join("/"))

    if (node.type === "folder") {
      return (
        <div key={currentPath.join("/")}>
          <div
            className={cn(
              "flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-muted",
              currentFolder === node && "bg-muted",
            )}
            onClick={() => {
              toggleFolder(currentPath.join("/"))
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
            <div className="pl-4">{node.children.map((child: any) => renderTree(child, currentPath))}</div>
          )}
        </div>
      )
    }

    return (
      <div
        key={currentPath.join("/")}
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-muted ml-6",
          selectedFile === node && "bg-muted",
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
        <h2 className="text-lg font-semibold">File Manager</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            New Folder
          </Button>
          <Button variant="outline" size="sm">
            Upload
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
                    let targetFolder = fileSystem
                    const path = [fileSystem.name]

                    // Navigate to the clicked breadcrumb
                    for (let i = 1; i <= index; i++) {
                      const folderName = breadcrumbs[i]
                      const folder = targetFolder.children.find(
                        (c: any) => c.name === folderName && c.type === "folder",
                      )
                      if (folder) {
                        targetFolder = folder
                        path.push(folder.name)
                      }
                    }

                    navigateToFolder(targetFolder, path)
                  }}
                >
                  {crumb}
                </Button>
              </div>
            ))}
          </div>

          {/* File list */}
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentFolder.children?.map((item: any) => (
                <Card
                  key={item.name}
                  className={cn(
                    "cursor-pointer hover:border-primary/50 transition-colors",
                    selectedFile === item && "border-primary",
                  )}
                  onClick={() => {
                    if (item.type === "folder") {
                      navigateToFolder(item, [...breadcrumbs, item.name])
                      toggleFolder([...breadcrumbs, item.name].join("/"))
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
                          <ImageIcon className="h-16 w-16 text-green-500" />
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
                            className="absolute top-0 right-0 h-6 w-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Rename</DropdownMenuItem>
                          <DropdownMenuItem>Download</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium truncate max-w-[120px]">{item.name}</p>
                      {item.type !== "folder" && <p className="text-xs text-muted-foreground">{item.size}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Preview panel */}
          {selectedFile && (
            <div className="border-t p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{selectedFile.name}</h3>
                <Button variant="outline" size="sm">
                  Download
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p>{selectedFile.type.charAt(0).toUpperCase() + selectedFile.type.slice(1)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p>{selectedFile.size}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Modified</p>
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

