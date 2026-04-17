import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const hours = Array.from({ length: 12 }, (_, i) => `${(i + 7).toString().padStart(2, "0")}:00`);

const events = [
  { title: "Estrutura de Dados", day: 1, hour: 8, duration: 2, color: "gradient-primary" },
  { title: "Banco de Dados II", day: 1, hour: 10, duration: 2, color: "gradient-success" },
  { title: "Eng. de Software", day: 2, hour: 14, duration: 2, color: "gradient-primary" },
  { title: "Redes", day: 3, hour: 8, duration: 2, color: "gradient-success" },
  { title: "Reunião de Projeto", day: 3, hour: 14, duration: 1, color: "gradient-primary" },
  { title: "IA", day: 4, hour: 10, duration: 2, color: "gradient-success" },
  { title: "Sist. Operacionais", day: 5, hour: 14, duration: 2, color: "gradient-primary" },
  { title: "Entrega: Projeto ED", day: 5, hour: 18, duration: 1, color: "bg-destructive" },
];

const todayEvents = [
  { title: "Estrutura de Dados", time: "08:00 - 10:00", type: "class" },
  { title: "Banco de Dados II", time: "10:00 - 12:00", type: "class" },
  { title: "Grupo de Estudo", time: "15:00 - 16:30", type: "meeting" },
];

const CalendarPage = () => {
  const [view, setView] = useState<"week" | "month">("week");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
          <p className="text-muted-foreground mt-1">Março 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm">Hoje</Button>
          <Button variant="outline" size="icon"><ChevronRight className="w-4 h-4" /></Button>
          <div className="flex bg-muted rounded-lg p-0.5 ml-2">
            <button onClick={() => setView("week")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Semana</button>
            <button onClick={() => setView("month")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Mês</button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <Card className="flex-1 card-shadow overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
              <div className="p-2" />
              {days.map((day, i) => (
                <div key={day} className={`p-3 text-center border-l border-border ${i === 1 ? "bg-primary/5" : ""}`}>
                  <p className="text-xs text-muted-foreground">{day}</p>
                  <p className={`text-lg font-semibold ${i === 1 ? "text-primary" : "text-foreground"}`}>{10 + i}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
              {hours.map((hour) => (
                <div key={hour} className="contents">
                  <div className="p-2 text-[10px] text-muted-foreground text-right pr-3 h-14 border-b border-border">{hour}</div>
                  {days.map((_, dayIdx) => (
                    <div key={dayIdx} className="h-14 border-l border-b border-border relative">
                      {events
                        .filter(e => e.day === dayIdx && e.hour === parseInt(hour))
                        .map((event) => (
                          <div
                            key={event.title}
                            className={`absolute inset-x-1 top-0.5 rounded-md px-1.5 py-1 text-[10px] font-medium text-primary-foreground ${event.color} cursor-pointer z-10`}
                            style={{ height: `${event.duration * 3.5 - 0.25}rem` }}
                          >
                            {event.title}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="w-72 card-shadow h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Agenda de Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayEvents.map((e) => (
              <div key={e.title} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                <div className={`w-1 h-10 rounded-full ${e.type === "class" ? "gradient-primary" : "gradient-success"}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{e.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;
