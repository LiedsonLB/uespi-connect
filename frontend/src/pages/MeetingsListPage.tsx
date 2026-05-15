// frontend/src/pages/MeetingsListPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { Plus, Video, Calendar, Trash2, Users, Edit2, Check, X, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Meeting {
  id: string;
  title: string;
  created_at: string;
  created_by?: string;
  participants?: number;
}

export default function MeetingsListPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [newMeetingTitle, setNewMeetingTitle] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    loadMeetings();
  }, []);

  // Buscar contagem real de participantes de cada sala
  const getParticipantsCount = async (roomName: string): Promise<number> => {
    try {
      // Opção 1: Usar a API do LiveKit (se disponível)
      const response = await apiFetch(`/api/meetings/${roomName}/participants`);
      if (response.ok) {
        const data = await response.json();
        return data.count || 0;
      }
    } catch (error) {
      console.error(`Erro ao buscar participantes da sala ${roomName}:`, error);
    }

    // Fallback: retorna 0 se não conseguir buscar
    return 0;
  };

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch("/api/meetings");
      const data = await res.json();

      // Buscar contagem real de participantes para cada reunião
      const meetingsWithRealParticipants = await Promise.all(
        data.map(async (meeting: Meeting) => {
          const participantCount = await getParticipantsCount(meeting.id);
          return {
            ...meeting,
            participants: participantCount,
          };
        })
      );

      setMeetings(meetingsWithRealParticipants);
    } catch (error) {
      console.error("Erro ao carregar reuniões:", error);
      toast.error("Erro ao carregar reuniões");
    } finally {
      setIsLoading(false);
    }
  };

  const createMeeting = async () => {
    const title = newMeetingTitle.trim() || `Reunião ${new Date().toLocaleString()}`;

    setIsCreating(true);
    try {
      const res = await apiFetch("/api/meetings", {
        method: "POST",
        body: JSON.stringify({ title })
      });

      const meeting = await res.json();
      setShowCreateDialog(false);
      setNewMeetingTitle("");
      toast.success("Reunião criada com sucesso!");
      navigate(`/meeting/${meeting.id}`);
    } catch (error) {
      console.error("Erro ao criar reunião:", error);
      toast.error("Erro ao criar reunião");
    } finally {
      setIsCreating(false);
    }
  };

  const updateMeetingTitle = async (meetingId: string, newTitle: string) => {
    try {
      await apiFetch(`/api/meetings/${meetingId}`, {
        method: "PUT",
        body: JSON.stringify({ title: newTitle })
      });
      await loadMeetings();
      toast.success("Título atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar título:", error);
      toast.error("Erro ao atualizar título");
    }
  };

  const deleteMeeting = async (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir esta reunião?")) {
      try {
        await apiFetch(`/api/meetings/${meetingId}`, {
          method: "DELETE"
        });
        await loadMeetings();
        toast.success("Reunião excluída!");
      } catch (error) {
        console.error("Erro ao deletar reunião:", error);
        toast.error("Erro ao deletar reunião");
      }
    }
  };

  const copyMeetingLink = (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const startEditing = (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(meeting.id);
    setEditingTitle(meeting.title);
  };

  const saveEditing = async (meetingId: string) => {
    if (editingTitle.trim()) {
      await updateMeetingTitle(meetingId, editingTitle);
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const joinMeeting = (meetingId: string) => {
    navigate(`/meeting/${meetingId}`);
  };

  const getGradientColor = (index: number) => {
    const colors = [
      "gradient-primary",
      "gradient-secondary",
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando reuniões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          {/* reuniões de todo mundo */}
          <h1 className="text-2xl font-bold text-foreground">
            {role === "professor" ? "Minhas Reuniões" : "Reuniões Disponíveis"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {role === "professor"
              ? "Gerencie suas videoconferências e aulas ao vivo"
              : "Participe das suas reuniões e aulas ao vivo"}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gradient-primary gap-2">
              <Plus className="w-4 h-4" />
              Nova Reunião
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Reunião</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nome da Reunião (opcional)
                </label>
                <Input
                  placeholder="Ex: Aula de Estrutura de Dados"
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createMeeting()}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Deixe em branco para usar um nome automático
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={createMeeting} disabled={isCreating}>
                  {isCreating ? "Criando..." : "Criar Reunião"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {meetings.length === 0 ? (
        <Card className="p-12 text-center">
          <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Nenhuma reunião ainda</h2>
          <p className="text-muted-foreground mb-4">
            Crie sua primeira reunião para começar a colaborar
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="gradient-primary">
            Criar Primeira Reunião
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {meetings.map((meeting, index) => (
            <Card
              key={meeting.id}
              className="card-shadow hover:card-shadow-hover transition-all group overflow-hidden"
            >
              <div className={`h-2 ${getGradientColor(index)}`} />
              <CardContent className="p-5">
                <div className="mb-3">
                  {editingId === meeting.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditing(meeting.id);
                          if (e.key === "Escape") cancelEditing();
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => saveEditing(meeting.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between group">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors flex-1">
                        {meeting.title}
                      </h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => startEditing(meeting, e)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => deleteMeeting(meeting.id, e)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {meeting.participants || 0} participante(s) ativo(s)
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(meeting.created_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">ID da Reunião</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {meeting.id.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getGradientColor(index)} transition-all`}
                      style={{ width: `${Math.min(100, (meeting.participants || 0) * 10)}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className={`flex-1 ${getGradientColor(index)} border-0 text-primary-foreground`}
                    onClick={(e) => {
                      e.stopPropagation();
                      joinMeeting(meeting.id);
                    }}
                  >
                    <Video className="w-3.5 h-3.5 mr-1.5" /> Entrar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => copyMeetingLink(meeting.id, e)}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Compartilhar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}