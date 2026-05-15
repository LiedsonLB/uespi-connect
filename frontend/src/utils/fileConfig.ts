import {
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  File,
} from "lucide-react";

export const getFileConfig = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return {
        icon: FileText,
        color: "text-destructive bg-destructive/10",
        type: "PDF",
      };

    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return {
        icon: Image,
        color: "text-accent bg-accent/10",
        type: "Imagem",
      };

    case "xlsx":
    case "xls":
    case "csv":
      return {
        icon: FileSpreadsheet,
        color: "text-secondary bg-secondary/10",
        type: "Planilha",
      };

    case "ppt":
    case "pptx":
      return {
        icon: Presentation,
        color: "text-warning bg-warning/10",
        type: "Apresentação",
      };

    case "doc":
    case "docx":
      return {
        icon: FileText,
        color: "text-primary bg-primary/10",
        type: "Documento",
      };

    default:
      return {
        icon: File,
        color: "text-muted-foreground bg-muted",
        type: "Arquivo",
      };
  }
};