import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Video,
  Radio,
  MessageCircle,
  FolderOpen,
  Calendar,
  User,
  Shield,
  Search,
  Bell,
  ChevronLeft,
  Menu,
  LogOut,
  User2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Adicionado AvatarImage
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface NavItem {
  title: string;
  icon: typeof LayoutDashboard;
  path: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  // { title: "Painel", icon: LayoutDashboard, path: "/", roles: ["admin", "professor", "aluno"] },
  // { title: "Turmas", icon: GraduationCap, path: "/classes", roles: ["professor", "aluno"] },
  { title: "Reuniões", icon: Video, path: "/meetings", roles: ["admin", "professor", "aluno"] },
  { title: "Eventos", icon: Radio, path: "/events", roles: ["admin", "professor", "aluno"] },
  // { title: "Chat", icon: MessageCircle, path: "/chat", roles: ["professor", "aluno"] },
  { title: "Arquivos", icon: FolderOpen, path: "/files", roles: ["professor", "aluno"] },
  // { title: "Calendário", icon: Calendar, path: "/calendar", roles: ["admin", "professor", "aluno"] },
  { title: "Perfil", icon: User, path: "/profile", roles: ["admin", "professor", "aluno"] },
  { title: "Administração", icon: Shield, path: "/admin", roles: ["admin"] },
];

const roleBadge: Record<UserRole, string> = {
  admin: "Administrador",
  professor: "Professor",
  aluno: "Aluno",
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const filteredNav = navItems.filter((item) => role && item.roles.includes(role));

  const handleLogout = () => {
    console.log("Logging out user:", user);
    console.log("Logging out user:", user?.profilePicture);
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col ${collapsed ? "w-[68px]" : "w-[240px]"
          }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border gap-3">

          {/* Sidebar aberta */}
          {!collapsed && (
            <div className="w-32 h-9 flex items-center justify-center flex-shrink-0">
              <img src="/neomeet_logo_cut.png" alt="NeoMeet Logo" />
            </div>
          )}

          {/* Sidebar fechada */}
          {collapsed && (
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
              <img src="/neomeet_icon_cut.png" alt="NeoMeet Icon" />
            </div>
          )}

        </div>

        {/* Role badge */}
        {!collapsed && role && (
          <div className="px-4 py-2">
            <Badge variant="outline" className="w-full justify-start">
              <div className="flex items-center gap-1 font-medium px-2 py-1">
                <User2 className="w-3.5 h-3.5 mr-1.5" /> {roleBadge[role]}
              </div>
            </Badge>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            // colocar condição da rota / que é o meetings, pq tem que ser ativa tanto para /meetings quanto para /meeting/:roomName
            const isActive =
              location.pathname === item.path ||
              (item.path === "/meetings" &&
                (location.pathname === "/" ||
                  location.pathname.startsWith("/meeting/")));
            return (
              <Tooltip key={item.path} delayDuration={collapsed ? 100 : 1000}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="animate-fade-in">{item.title}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">{item.title}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /><span>Recolher</span></>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? "ml-[68px]" : "ml-[240px]"}`}>
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-md"></div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={user?.profilePicture}
                      alt={user?.name}
                      referrerPolicy="no-referrer"
                    />
                    <AvatarFallback>
                      {user?.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden md:inline">{user?.name?.split(' ')[0]} {user?.name?.split(' ')[1]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
{/* 
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse-dot" />
            </Button> */}
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}