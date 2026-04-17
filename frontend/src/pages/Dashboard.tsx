import {
  Clock,
  Users,
  BookOpen,
  Bell,
  Video,
  FileText,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

const upcomingClasses = [
  { name: "Estrutura de Dados", professor: "Prof. Ana Souza", time: "08:00", status: "Em 15 min", urgent: true },
  { name: "Banco de Dados II", professor: "Prof. Carlos Lima", time: "10:00", status: "Em 2h 15min", urgent: false },
  { name: "Eng. de Software", professor: "Prof. Maria Santos", time: "14:00", status: "Hoje 14:00", urgent: false },
];

const announcements = [
  { title: "Prova de Estrutura de Dados remarcada", course: "Estrutura de Dados", time: "2h atrás" },
  { title: "Material novo disponível", course: "Banco de Dados II", time: "5h atrás" },
  { title: "Projeto final: grupos definidos", course: "Eng. de Software", time: "1 dia atrás" },
];

const recentFiles = [
  { name: "Aula 08 - Árvores Binárias.pdf", course: "Estrutura de Dados", size: "2.4 MB" },
  { name: "Projeto Final - Requisitos.docx", course: "Eng. de Software", size: "890 KB" },
  { name: "SQL Avançado - Slides.pptx", course: "Banco de Dados II", size: "5.1 MB" },
];

const Dashboard = () => {
  const { user, role } = useAuth();

  const statsForRole = role === "admin"
    ? [
        { label: "Total de Usuários", value: "2.847", icon: Users, color: "bg-primary/10 text-primary" },
        { label: "Cursos Ativos", value: "156", icon: BookOpen, color: "bg-secondary/10 text-secondary" },
        { label: "Reuniões Hoje", value: "34", icon: Video, color: "bg-accent/10 text-accent" },
        { label: "Eventos Próximos", value: "12", icon: Clock, color: "bg-warning/10 text-warning" },
      ]
    : role === "professor"
    ? [
        { label: "Minhas Turmas", value: "4", icon: BookOpen, color: "bg-primary/10 text-primary" },
        { label: "Alunos Totais", value: "155", icon: Users, color: "bg-secondary/10 text-secondary" },
        { label: "Aulas Hoje", value: "3", icon: Video, color: "bg-accent/10 text-accent" },
        { label: "Materiais Enviados", value: "48", icon: FileText, color: "bg-warning/10 text-warning" },
      ]
    : [
        { label: "Disciplinas Matriculadas", value: "6", icon: BookOpen, color: "bg-primary/10 text-primary" },
        { label: "Taxa de Frequência", value: "92%", icon: CheckCircle2, color: "bg-secondary/10 text-secondary" },
        { label: "Reuniões Agendadas", value: "3", icon: Video, color: "bg-accent/10 text-accent" },
        { label: "Tarefas Pendentes", value: "8", icon: Clock, color: "bg-warning/10 text-warning" },
      ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bem-vindo(a), {user?.name?.split(" ")[0]}! 👋</h1>
        <p className="text-muted-foreground mt-1">Veja o que está acontecendo hoje no UESPI Hub.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsForRole.map((stat) => (
          <Card key={stat.label} className="card-shadow hover:card-shadow-hover transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximas aulas */}
        <Card className="lg:col-span-2 card-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Próximas Aulas</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingClasses.map((cls) => (
              <div key={cls.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cls.urgent ? "gradient-primary" : "bg-muted"}`}>
                    <BookOpen className={`w-5 h-5 ${cls.urgent ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{cls.name}</p>
                    <p className="text-xs text-muted-foreground">{cls.professor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={cls.urgent ? "default" : "secondary"} className={cls.urgent ? "gradient-primary border-0" : ""}>
                    {cls.status}
                  </Badge>
                  <Button size="sm" variant={cls.urgent ? "default" : "outline"} className={cls.urgent ? "gradient-primary border-0" : ""}>
                    Entrar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Frequência */}
        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Sua Frequência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" strokeDasharray="92, 100" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">92%</span>
                  <span className="text-xs text-muted-foreground">Geral</span>
                </div>
              </div>
            </div>
            {[
              { name: "Estrutura de Dados", pct: 95 },
              { name: "Banco de Dados II", pct: 88 },
              { name: "Eng. de Software", pct: 93 },
            ].map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="font-medium text-foreground">{c.pct}%</span>
                </div>
                <Progress value={c.pct} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Avisos */}
        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Avisos</CardTitle>
              <Badge variant="secondary">3 novos</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.map((a) => (
              <div key={a.title} className="flex gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.course} · {a.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Arquivos recentes */}
        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Arquivos Recentes</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todos <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentFiles.map((f) => (
              <div key={f.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-destructive" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.course} · {f.size}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
