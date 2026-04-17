import { useState } from "react";
import { Hash, Send, Smile, Paperclip, AtSign, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const channels = [
  { name: "geral", unread: 3 },
  { name: "avisos", unread: 1 },
  { name: "trabalhos", unread: 0 },
  { name: "projetos", unread: 5 },
  { name: "off-topic", unread: 0 },
  { name: "dúvidas", unread: 2 },
];

const messages = [
  { user: "Prof. Ana Souza", avatar: "AS", text: "Bom dia, turma! Lembrem-se que a entrega do projeto é sexta-feira.", time: "08:30", reactions: ["👍 4", "✅ 2"] },
  { user: "Maria Oliveira", avatar: "MO", text: "Professora, podemos usar qualquer linguagem de programação?", time: "08:35", reactions: [] },
  { user: "Prof. Ana Souza", avatar: "AS", text: "Sim, podem usar Python, Java ou C++. O importante é a documentação.", time: "08:37", reactions: ["👍 6"] },
  { user: "Pedro Santos", avatar: "PS", text: "Alguém quer formar grupo para o projeto?", time: "09:00", reactions: ["🙋 3"] },
  { user: "Lucas Mendes", avatar: "LM", text: "Eu topo! Me chama no privado.", time: "09:05", reactions: [] },
  { user: "Ana Clara", avatar: "AC", text: "Compartilhei o template do relatório no canal #trabalhos", time: "09:15", reactions: ["❤️ 5", "🙏 3"] },
];

const ChatPage = () => {
  const [activeChannel, setActiveChannel] = useState("geral");

  return (
    <div className="animate-fade-in h-[calc(100vh-7rem)]">
      <div className="flex h-full gap-0 rounded-xl overflow-hidden border border-border bg-card card-shadow">
        <div className="w-60 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground mb-2">Estrutura de Dados</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-8 h-8 text-xs bg-muted/50 border-0" />
            </div>
          </div>
          <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {channels.map((ch) => (
              <button
                key={ch.name}
                onClick={() => setActiveChannel(ch.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeChannel === ch.name
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2"><Hash className="w-4 h-4" />{ch.name}</span>
                {ch.unread > 0 && (
                  <Badge className={`text-[10px] h-5 min-w-5 ${activeChannel === ch.name ? "bg-primary-foreground/20 text-primary-foreground border-0" : "bg-primary text-primary-foreground border-0"}`}>
                    {ch.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground">#{activeChannel}</span>
            <span className="text-xs text-muted-foreground">· 42 membros</span>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className="flex gap-3 group hover:bg-muted/30 p-2 -mx-2 rounded-lg transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{msg.avatar}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">{msg.user}</span>
                    <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-0.5">{msg.text}</p>
                  {msg.reactions.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5">
                      {msg.reactions.map((r) => (
                        <span key={r} className="text-xs bg-muted px-2 py-0.5 rounded-full cursor-pointer hover:bg-muted/80">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Paperclip className="w-4 h-4" /></Button>
              <input placeholder={`Mensagem em #${activeChannel}`} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><AtSign className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Smile className="w-4 h-4" /></Button>
              <Button size="icon" className="h-8 w-8 gradient-primary border-0 rounded-lg"><Send className="w-4 h-4 text-primary-foreground" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
