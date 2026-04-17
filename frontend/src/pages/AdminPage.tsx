import { Users, BookOpen, Video, Eye, Settings, Plus, Search, MoreHorizontal, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const stats = [
  { label: "Total de Usuários", value: "2.847", change: "+12%", icon: Users },
  { label: "Cursos Ativos", value: "156", change: "+8%", icon: BookOpen },
  { label: "Reuniões Hoje", value: "34", change: "+23%", icon: Video },
  { label: "Acessos da Plataforma", value: "12.4k", change: "+15%", icon: Eye },
];

const users = [
  { name: "Ana Souza", email: "ana.souza@uespi.br", role: "Professor", status: "Ativo", courses: 4 },
  { name: "Carlos Lima", email: "carlos.lima@uespi.br", role: "Professor", status: "Ativo", courses: 3 },
  { name: "João Silva", email: "joao.silva@aluno.uespi.br", role: "Aluno", status: "Ativo", courses: 6 },
  { name: "Maria Oliveira", email: "maria.o@aluno.uespi.br", role: "Aluno", status: "Ativo", courses: 5 },
  { name: "Pedro Santos", email: "pedro.s@aluno.uespi.br", role: "Aluno", status: "Inativo", courses: 4 },
];

const courses = [
  { name: "Estrutura de Dados", professor: "Ana Souza", students: 42, status: "Ativo" },
  { name: "Banco de Dados II", professor: "Carlos Lima", students: 38, status: "Ativo" },
  { name: "Eng. de Software", professor: "Maria Santos", students: 35, status: "Ativo" },
  { name: "Redes de Computadores", professor: "Pedro Alves", students: 40, status: "Ativo" },
];

const AdminPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-1">Gerenciamento e estatísticas da plataforma</p>
        </div>
        <Button className="gradient-primary border-0 text-primary-foreground">
          <Settings className="w-4 h-4 mr-2" /> Configurações
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="card-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <span className="text-xs text-secondary font-medium flex items-center gap-0.5 mt-1"><TrendingUp className="w-3 h-3" />{stat.change}</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="recordings">Gravações</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Gerenciar Usuários</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input placeholder="Buscar usuários..." className="pl-8 h-9 w-60 text-sm" />
                  </div>
                  <Button size="sm" className="gradient-primary border-0 text-primary-foreground"><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">E-mail</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Função</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Cursos</th>
                    <th className="p-3" />
                  </tr></thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.email} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium text-foreground">{user.name}</td>
                        <td className="p-3 text-muted-foreground">{user.email}</td>
                        <td className="p-3"><Badge variant="secondary">{user.role}</Badge></td>
                        <td className="p-3"><Badge variant={user.status === "Ativo" ? "default" : "secondary"} className={user.status === "Ativo" ? "bg-secondary/10 text-secondary border-0" : ""}>{user.status}</Badge></td>
                        <td className="p-3 text-muted-foreground">{user.courses}</td>
                        <td className="p-3"><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Gerenciar Cursos</CardTitle>
                <Button size="sm" className="gradient-primary border-0 text-primary-foreground"><Plus className="w-4 h-4 mr-1" />Adicionar Curso</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Curso</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Professor</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Alunos</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="p-3" />
                  </tr></thead>
                  <tbody>
                    {courses.map((c) => (
                      <tr key={c.name} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium text-foreground">{c.name}</td>
                        <td className="p-3 text-muted-foreground">{c.professor}</td>
                        <td className="p-3 text-muted-foreground">{c.students}</td>
                        <td className="p-3"><Badge className="bg-secondary/10 text-secondary border-0">{c.status}</Badge></td>
                        <td className="p-3"><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recordings" className="mt-4">
          <Card className="card-shadow">
            <CardContent className="p-12 text-center">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">Nenhuma gravação ainda</h3>
              <p className="text-sm text-muted-foreground mt-1">Gravações das reuniões aparecerão aqui</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
