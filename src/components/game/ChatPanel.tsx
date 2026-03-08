import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Lock, Search, UserPlus, Check, X, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";

interface ChatPanelProps {
  studentId: string;
}

interface FriendResult {
  id: string;
  nickname: string | null;
  display_name: string;
  village_level: number;
  district: string | null;
}

interface Friendship {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  requester_parent_approved: boolean;
  receiver_parent_approved: boolean;
  created_at: string;
  // Joined data
  other_player?: FriendResult;
}

export const ChatPanel = ({ studentId }: ChatPanelProps) => {
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [approvedFriends, setApprovedFriends] = useState<Friendship[]>([]);
  const [pendingFriendships, setPendingFriendships] = useState<Friendship[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Load friendships
  useEffect(() => {
    loadFriendships();
  }, [studentId]);

  const loadFriendships = async () => {
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${studentId},receiver_id.eq.${studentId}`);

    if (!data) return;

    // Load other player info for each friendship
    const otherIds = data.map(f => f.requester_id === studentId ? f.receiver_id : f.requester_id);
    const { data: players } = await supabase
      .from("students")
      .select("id, nickname, display_name, village_level, district")
      .in("id", otherIds);

    const playerMap = new Map(players?.map(p => [p.id, p]) || []);
    const enriched = data.map(f => ({
      ...f,
      other_player: playerMap.get(f.requester_id === studentId ? f.receiver_id : f.requester_id),
    }));

    setFriendships(enriched);
    setApprovedFriends(enriched.filter(f => f.status === "approved"));
    setPendingFriendships(enriched.filter(f => f.status === "pending_parent_approval"));
  };

  // Search by nickname
  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast.error("Escreve pelo menos 2 caracteres para pesquisar");
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("students")
      .select("id, nickname, display_name, village_level, district")
      .neq("id", studentId)
      .ilike("nickname", `%${searchQuery.trim()}%`)
      .limit(10);

    // Filter out existing friendships
    const existingIds = new Set(friendships.map(f =>
      f.requester_id === studentId ? f.receiver_id : f.requester_id
    ));
    setSearchResults((data || []).filter(p => !existingIds.has(p.id)));
    setSearching(false);
  };

  // Send friend request
  const handleSendRequest = async (receiverId: string) => {
    const { error } = await supabase.from("friendships").insert({
      requester_id: studentId,
      receiver_id: receiverId,
      status: "pending_parent_approval",
      requester_parent_approved: false,
      receiver_parent_approved: false,
    });

    if (error) {
      toast.error("Erro ao enviar pedido: " + error.message);
    } else {
      toast.success("Pedido de amizade enviado! O teu encarregado de educação precisa aprovar primeiro.");
      setSearchResults(prev => prev.filter(p => p.id !== receiverId));
      loadFriendships();
    }
  };

  // Load chat messages for selected friend
  const loadMessages = async (friendId: string) => {
    setLoadingChat(true);
    setSelectedFriend(friendId);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${studentId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${studentId})`
      )
      .order("created_at", { ascending: true })
      .limit(50);
    setChatMessages(data || []);
    setLoadingChat(false);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedFriend) return;
    const { error } = await supabase.from("chat_messages").insert({
      sender_id: studentId,
      receiver_id: selectedFriend,
      message: message.trim(),
    });
    if (error) {
      toast.error("Erro ao enviar mensagem");
    } else {
      setMessage("");
      loadMessages(selectedFriend);
    }
  };

  const selectedFriendData = approvedFriends.find(f =>
    (f.requester_id === studentId ? f.receiver_id : f.requester_id) === selectedFriend
  )?.other_player;

  return (
    <div className="px-4 space-y-4">
      <h2 className="font-display text-xl font-bold text-center">💬 Amigos & Chat</h2>

      {/* Search for friends by nickname */}
      <div className="game-border bg-card p-4">
        <h3 className="font-display text-sm font-bold mb-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Procurar amigos por nickname
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Nickname do jogador..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="flex-1"
            maxLength={20}
          />
          <Button size="sm" onClick={handleSearch} disabled={searching}>
            {searching ? "..." : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map(player => (
              <div key={player.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                <div>
                  <span className="font-body font-bold text-sm">{player.nickname || player.display_name}</span>
                  <span className="font-body text-xs text-muted-foreground ml-2">Nv.{player.village_level}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleSendRequest(player.id)}>
                  <UserPlus className="w-4 h-4 mr-1" /> Pedir
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending friendships */}
      {pendingFriendships.length > 0 && (
        <div className="game-border bg-card p-4">
          <h3 className="font-display text-sm font-bold mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-gold" />
            Pedidos pendentes ({pendingFriendships.length})
          </h3>
          <div className="space-y-2">
            {pendingFriendships.map(f => {
              const isRequester = f.requester_id === studentId;
              return (
                <div key={f.id} className="flex items-center justify-between bg-gold/5 rounded-lg p-2 border border-gold/20">
                  <div>
                    <span className="font-body font-bold text-sm">
                      {f.other_player?.nickname || f.other_player?.display_name || "Jogador"}
                    </span>
                    <div className="font-body text-[10px] text-muted-foreground space-x-2">
                      <span>{isRequester ? "Enviado por ti" : "Recebido"}</span>
                      <span>•</span>
                      <span>Aprovação pai que pede: {f.requester_parent_approved ? "✅" : "⏳"}</span>
                      <span>•</span>
                      <span>Aprovação pai solicitado: {f.receiver_parent_approved ? "✅" : "⏳"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="font-body text-[10px] text-muted-foreground mt-2">
            ⏳ Os encarregados de educação de ambos os jogadores precisam aprovar.
          </p>
        </div>
      )}

      {/* Approved friends list + chat */}
      {approvedFriends.length > 0 ? (
        <div className="game-border bg-card p-4">
          <h3 className="font-display text-sm font-bold mb-2 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Amigos ({approvedFriends.length})
          </h3>

          {/* Friend list */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {approvedFriends.map(f => {
              const friendId = f.requester_id === studentId ? f.receiver_id : f.requester_id;
              const isSelected = selectedFriend === friendId;
              return (
                <Button
                  key={f.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => loadMessages(friendId)}
                >
                  {f.other_player?.nickname || f.other_player?.display_name || "Amigo"}
                </Button>
              );
            })}
          </div>

          {/* Chat area */}
          {selectedFriend && (
            <div>
              <div className="bg-muted/20 rounded-lg p-3 h-48 overflow-y-auto space-y-2 mb-2">
                {loadingChat ? (
                  <p className="text-xs text-muted-foreground text-center">A carregar...</p>
                ) : chatMessages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Inicia a conversa com {selectedFriendData?.nickname || "o teu amigo"}! 👋
                  </p>
                ) : (
                  chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === studentId ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`rounded-lg px-3 py-1.5 max-w-[75%] text-xs font-body ${
                        msg.sender_id === studentId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Escreve uma mensagem..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                  maxLength={200}
                />
                <Button size="icon" onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="game-border bg-card p-6 text-center">
          <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-body text-sm text-muted-foreground">
            Ainda não tens amigos aprovados. Pesquisa por nickname acima para enviar pedidos!
          </p>
          <p className="font-body text-[10px] text-muted-foreground mt-2">
            🛡️ Os encarregados de educação de ambos os jogadores têm de aprovar a amizade.
          </p>
        </div>
      )}
    </div>
  );
};
