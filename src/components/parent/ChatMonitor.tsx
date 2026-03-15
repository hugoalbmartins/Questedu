import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Pin, Ban, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { ChatBlockManager } from "./ChatBlockManager";

interface ChatMonitorProps {
  parentId: string;
  children: { id: string; display_name: string; nickname?: string }[];
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_flagged_by_parent: boolean;
  parent_notes: string | null;
  retention_expires_at: string;
}

export const ChatMonitor = ({ parentId, children: kids }: ChatMonitorProps) => {
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [filterMode, setFilterMode] = useState<"all" | "flagged">("all");
  const [showBlockManager, setShowBlockManager] = useState(false);

  useEffect(() => {
    if (kids.length === 0) return;
    const kidIds = kids.map(k => k.id);

    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(kidIds.map(id => `sender_id.eq.${id}`).join(",") + "," + kidIds.map(id => `receiver_id.eq.${id}`).join(","))
        .order("created_at", { ascending: false })
        .limit(200);

      if (!data) return;

      // Group by child
      const grouped: Record<string, Message[]> = {};
      kidIds.forEach(id => { grouped[id] = []; });
      data.forEach(msg => {
        const childId = kidIds.find(id => id === msg.sender_id || id === msg.receiver_id);
        if (childId) grouped[childId].push(msg);
      });
      setMessages(grouped);

      // Get all unique non-child player IDs
      const otherIds = [...new Set(data.flatMap(m => [m.sender_id, m.receiver_id]).filter(id => !kidIds.includes(id)))];
      if (otherIds.length > 0) {
        const { data: players } = await supabase
          .from("students")
          .select("id, nickname, display_name")
          .in("id", otherIds);
        const map: Record<string, string> = {};
        kids.forEach(k => { map[k.id] = k.nickname || k.display_name; });
        players?.forEach(p => { map[p.id] = p.nickname || p.display_name; });
        setPlayerNames(map);
      } else {
        const map: Record<string, string> = {};
        kids.forEach(k => { map[k.id] = k.nickname || k.display_name; });
        setPlayerNames(map);
      }
    };

    loadMessages();
  }, [kids, filterMode]);

  const handleFlagMessage = async (messageId: string, isFlagged: boolean) => {
    const { error } = await supabase
      .from("chat_messages")
      .update({ is_flagged_by_parent: isFlagged })
      .eq("id", messageId);

    if (error) {
      toast.error("Erro ao marcar mensagem");
    } else {
      toast.success(isFlagged ? "Mensagem marcada como importante" : "Marca removida");
      // Reload messages
      const kidIds = kids.map(k => k.id);
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(kidIds.map(id => `sender_id.eq.${id}`).join(",") + "," + kidIds.map(id => `receiver_id.eq.${id}`).join(","))
        .order("created_at", { ascending: false })
        .limit(200);

      if (data) {
        const grouped: Record<string, Message[]> = {};
        kidIds.forEach(id => { grouped[id] = []; });
        data.forEach(msg => {
          const childId = kidIds.find(id => id === msg.sender_id || id === msg.receiver_id);
          if (childId) grouped[childId].push(msg);
        });
        setMessages(grouped);
      }
    }
  };

  const getFilteredMessages = (msgs: Message[]) => {
    if (filterMode === "flagged") {
      return msgs.filter(m => m.is_flagged_by_parent);
    }
    return msgs;
  };

  if (kids.length === 0) {
    return (
      <div className="text-center py-6">
        <MessageCircle className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
        <p className="font-body text-sm text-muted-foreground">Sem educandos registados.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-bold">Monitor de Chat</h3>
        </div>
        <Dialog open={showBlockManager} onOpenChange={setShowBlockManager}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Ban className="w-4 h-4 mr-1" /> Gerir Bloqueios
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestão de Bloqueios</DialogTitle>
            </DialogHeader>
            <ChatBlockManager children={kids} parentId={parentId} />
          </DialogContent>
        </Dialog>
      </div>
      <p className="font-body text-xs text-muted-foreground mb-2">
        Veja as conversas dos seus educandos. Marque mensagens importantes para preservação permanente.
      </p>

      <div className="flex gap-2 mb-4">
        <Select value={filterMode} onValueChange={(v: any) => setFilterMode(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="flagged">Marcadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue={kids[0]?.id}>
        <TabsList className="w-full mb-3">
          {kids.map(k => (
            <TabsTrigger key={k.id} value={k.id} className="font-body text-xs flex-1">
              {k.nickname || k.display_name}
              {messages[k.id]?.length ? ` (${messages[k.id].length})` : ""}
            </TabsTrigger>
          ))}
        </TabsList>

        {kids.map(k => (
          <TabsContent key={k.id} value={k.id}>
            {(!messages[k.id] || messages[k.id].length === 0) ? (
              <p className="font-body text-sm text-muted-foreground text-center py-4">
                Sem mensagens.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {getFilteredMessages(messages[k.id]).map(msg => {
                  const isChild = msg.sender_id === k.id;
                  return (
                    <div key={msg.id} className="group">
                      <div className={`flex ${isChild ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 relative ${
                          msg.is_flagged_by_parent
                            ? "bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500"
                            : isChild ? "bg-primary/10" : "bg-muted"
                        }`}>
                          {msg.is_flagged_by_parent && (
                            <Pin className="absolute -top-2 -right-2 w-4 h-4 text-amber-600 fill-amber-600" />
                          )}
                          <p className="font-body text-[10px] text-muted-foreground mb-0.5">
                            {playerNames[msg.sender_id] || "Jogador"} • {format(new Date(msg.created_at), "dd/MM HH:mm")}
                          </p>
                          <p className="font-body text-sm">{msg.message}</p>
                          {msg.is_flagged_by_parent && (
                            <p className="text-[9px] text-amber-700 dark:text-amber-500 mt-1">
                              ⚠️ Preservada permanentemente
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`flex ${isChild ? "justify-end" : "justify-start"} mt-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => handleFlagMessage(msg.id, !msg.is_flagged_by_parent)}
                        >
                          <Pin className="w-3 h-3 mr-1" />
                          {msg.is_flagged_by_parent ? "Remover marca" : "Marcar importante"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
