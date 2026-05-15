import { useEffect, useState } from "react";
import {
  FolderOpen,
  Upload,
  Search,
  Download,
  Eye,
  MoreHorizontal,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFileConfig } from "@/utils/fileConfig";

const FilesPage = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchFiles() {
      const response = await fetch("/api/files");
      const data = await response.json();

      setFiles(data.files);
      setFolders(data.folders);
    }

    fetchFiles();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Arquivos e Materiais</h1>
          <p className="text-muted-foreground">
            Materiais didáticos e documentos compartilhados
          </p>
        </div>

        <Button className="gradient-primary border-0">
          <Upload className="w-4 h-4 mr-2" />
          Enviar Arquivo
        </Button>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar arquivos e pastas..." className="pl-9 bg-card" />
      </div>

      {/* FOLDERS */}
      <div>
        <h2 className="text-sm font-semibold uppercase mb-3">
          Pastas
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <Card key={folder.id} className="cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>

                <div>
                  <p className="text-sm font-medium">
                    {folder.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {folder.filesCount} arquivos
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FILES */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {files.map((file) => {
              const config = getFileConfig(file.name);
              const Icon = config.icon;

              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        {file.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {config.type} · {file.size} · {file.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FilesPage;