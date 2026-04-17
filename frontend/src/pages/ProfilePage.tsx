import { Mail, BookOpen, Award, Clock, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

const attendanceHistory = [
  { course: "Estrutura de Dados", attended: 19, total: 20, pct: 95 },
  { course: "Banco de Dados II", attended: 15, total: 17, pct: 88 },
  { course: "Eng. de Software", attended: 14, total: 15, pct: 93 },
  { course: "Redes de Computadores", attended: 10, total: 12, pct: 83 },
  { course: "Inteligência Artificial", attended: 9, total: 10, pct: 90 },
  { course: "Sistemas Operacionais", attended: 12, total: 12, pct: 100 },
];

const roleName: Record<string, string> = {
  admin: "Administrador",
  professor: "Professor",
  aluno: "Aluno",
};

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="card-shadow overflow-hidden">
        <div className="h-32 gradient-primary relative" />
        <CardContent className="px-6 pb-6 relative">
          <div className="flex items-end gap-5 -mt-12">
            <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-primary">{user?.initials}</span>
            </div>
            <div className="pb-1 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-foreground">{user?.name}</h1>
                  <p className="text-sm text-muted-foreground">{user?.course || roleName[user?.role || ""]}</p>
                </div>
                <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-1.5" />Editar Perfil</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-shadow">
          <CardHeader className="pb-3"><CardTitle className="text-base">Informações</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Mail, label: "E-mail", value: user?.email || "" },
              { icon: BookOpen, label: "Curso", value: user?.course || "—" },
              { icon: Award, label: "Função", value: roleName[user?.role || ""] },
              { icon: Clock, label: "Desde", value: "2023.1" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center"><item.icon className="w-4 h-4 text-muted-foreground" /></div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 card-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Estatísticas de Frequência</CardTitle>
              <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0">92% Geral</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendanceHistory.map((course) => (
              <div key={course.course} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">{course.course}</span>
                  <span className="text-muted-foreground">{course.attended}/{course.total} aulas · <span className={course.pct >= 90 ? "text-secondary font-semibold" : course.pct >= 75 ? "text-warning font-semibold" : "text-destructive font-semibold"}>{course.pct}%</span></span>
                </div>
                <Progress value={course.pct} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
