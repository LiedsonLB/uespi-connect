import { Radio, Play, Calendar, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const events = [
  { title: "Semana de Tecnologia UESPI 2026", date: "20-24 Mar", time: "09:00 - 18:00", attendees: 450, live: true, type: "Conferência" },
  { title: "Workshop: Introdução ao Machine Learning", date: "18 Mar", time: "14:00 - 17:00", attendees: 80, live: false, type: "Workshop" },
  // { title: "Palestra: Carreira em TI", date: "25 Mar", time: "19:00 - 21:00", attendees: 200, live: false, type: "Palestra" },
  // { title: "Hackathon UESPI 2026", date: "5-6 Abr", time: "Dia inteiro", attendees: 120, live: false, type: "Hackathon" },
  // { title: "Defesa de TCC - Turma 2025", date: "10 Abr", time: "08:00 - 12:00", attendees: 60, live: false, type: "Acadêmico" },
  // { title: "Aula Magna: O Futuro da Computação", date: "15 Abr", time: "10:00 - 12:00", attendees: 300, live: false, type: "Palestra" },
];

const EventsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Eventos</h1>
        <p className="text-muted-foreground mt-1">Eventos, palestras e transmissões da universidade</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {events.map((event) => (
          <Card key={event.title} className="card-shadow hover:card-shadow-hover transition-all overflow-hidden group">
            <div className="h-32 gradient-primary relative flex items-center justify-center">
              <Radio className="w-12 h-12 text-primary-foreground/30" />
              {event.live && (
                <Badge className="absolute top-3 right-3 bg-destructive border-0 text-destructive-foreground animate-pulse-dot">
                  🔴 AO VIVO
                </Badge>
              )}
              <Badge className="absolute top-3 left-3 bg-background/20 border-0 text-primary-foreground backdrop-blur-sm">{event.type}</Badge>
            </div>
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{event.title}</h3>
              <div className="flex flex-col gap-1.5 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{event.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{event.time}</span>
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{event.attendees} participantes</span>
              </div>
              <Button className="w-full mt-4 gradient-primary border-0 text-primary-foreground" size="sm">
                {event.live ? <><Play className="w-4 h-4 mr-1.5" />Assistir Agora</> : "Inscrever-se"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventsPage;
