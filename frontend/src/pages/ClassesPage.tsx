import { BookOpen, Users, Clock, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const courses = [
  { id: 1, name: "Estrutura de Dados", professor: "Prof. Ana Souza", students: 42, nextClass: "Hoje 08:00", progress: 65, color: "gradient-primary" },
  { id: 2, name: "Banco de Dados II", professor: "Prof. Carlos Lima", students: 38, nextClass: "Hoje 10:00", progress: 45, color: "gradient-success" },
  { id: 3, name: "Engenharia de Software", professor: "Prof. Maria Santos", students: 35, nextClass: "Hoje 14:00", progress: 72, color: "gradient-primary" },
  { id: 4, name: "Redes de Computadores", professor: "Prof. Pedro Alves", students: 40, nextClass: "Amanhã 08:00", progress: 30, color: "gradient-success" },
  { id: 5, name: "Inteligência Artificial", professor: "Prof. Laura Costa", students: 28, nextClass: "Amanhã 10:00", progress: 55, color: "gradient-primary" },
  { id: 6, name: "Sistemas Operacionais", professor: "Prof. Ricardo Mendes", students: 45, nextClass: "Qua 14:00", progress: 80, color: "gradient-success" },
];

const ClassesPage = () => {
  const { role } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{role === "professor" ? "Minhas Turmas" : "Minhas Disciplinas"}</h1>
        <p className="text-muted-foreground mt-1">{role === "professor" ? "Turmas que você leciona neste semestre" : "Disciplinas matriculadas neste semestre"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {courses.map((course) => (
          <Card key={course.id} className="card-shadow hover:card-shadow-hover transition-all group cursor-pointer overflow-hidden">
            <div className={`h-2 ${course.color}`} />
            <CardContent className="p-5">
              <div className="mb-3">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{course.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{course.professor}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course.students} alunos</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.nextClass}</span>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium text-foreground">{course.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${course.color} transition-all`} style={{ width: `${course.progress}%` }} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 gradient-primary border-0 text-primary-foreground">
                  <Play className="w-3.5 h-3.5 mr-1.5" /> Entrar na Aula
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Materiais
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClassesPage;
