import { FileText, FolderOpen, Upload, Search, Download, Eye, MoreHorizontal, Image, FileSpreadsheet, Presentation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const folders = [
  { name: "Estrutura de Dados", files: 24 },
  { name: "Banco de Dados II", files: 18 },
  { name: "Eng. de Software", files: 31 },
  { name: "Redes de Computadores", files: 15 },
];

const files = [
  { name: "Árvores Binárias - Teoria.pdf", type: "PDF", size: "2.4 MB", date: "10 Mar", icon: FileText, color: "text-destructive bg-destructive/10" },
  { name: "Diagrama ER - Projeto.png", type: "Imagem", size: "1.2 MB", date: "9 Mar", icon: Image, color: "text-accent bg-accent/10" },
  { name: "Notas Parciais - Turma A.xlsx", type: "Planilha", size: "890 KB", date: "8 Mar", icon: FileSpreadsheet, color: "text-secondary bg-secondary/10" },
  { name: "Aula 07 - SQL Joins.pptx", type: "Apresentação", size: "5.1 MB", date: "7 Mar", icon: Presentation, color: "text-warning bg-warning/10" },
  { name: "Requisitos do Sistema.pdf", type: "PDF", size: "1.8 MB", date: "6 Mar", icon: FileText, color: "text-destructive bg-destructive/10" },
  { name: "Template Relatório Final.docx", type: "Documento", size: "420 KB", date: "5 Mar", icon: FileText, color: "text-primary bg-primary/10" },
];

const FilesPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Arquivos e Materiais</h1>
          <p className="text-muted-foreground mt-1">Materiais didáticos e documentos compartilhados</p>
        </div>
        <Button className="gradient-primary border-0 text-primary-foreground">
          <Upload className="w-4 h-4 mr-2" /> Enviar Arquivo
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar arquivos e pastas..." className="pl-9 bg-card border" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pastas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <Card key={folder.name} className="card-shadow hover:card-shadow-hover transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                  <p className="text-xs text-muted-foreground">{folder.files} arquivos</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Arquivos Recentes</h2>
        <Card className="card-shadow">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {files.map((file) => (
                <div key={file.name} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${file.color}`}>
                      <file.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.type} · {file.size} · {file.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Eye className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Download className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FilesPage;
