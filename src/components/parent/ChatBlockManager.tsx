import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Shield, Lock, Clock, Ban, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  display_name: string;
}

interface Friend {
  id: string;
  nickname: string | null;
  display_name: string;
}

interface Block {
  id: string;
  student_id: string;
  blocked_friend_id: string;
  blocked_at: string;
  blocked_until: string | null;
  is_permanent: boolean;
  reason: string | null;
  friend_name?: string;
}

interface ChatBlockManagerProps {
  children: Student[];
  parentId: string;
}

export const ChatBlockManager = ({ children, parentId }: ChatBlockManagerProps) => {
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockHistory, setBlockHistory] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string>("");
  const [blockDays, setBlockDays] = useState("1");
  const [blockReason, setBlockReason] = useState("");
  const [totalBlockedDays, setTotalBlockedDays] = useState(0);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockType, setBlockType] = useState<"temporary" | "permanent" | "all">("temporary");

  useEffect(() => {
    if (selectedChild) {
      loadFriends();
      loadBlocks();
      loadBlockHistory();
    }
  }, [selectedChild]);

  useEffect(() => {
    if (selectedChild && selectedFriend) {
      calculateTotalBlockedDays();
    }
  }, [selectedChild, selectedFriend]);

  const loadFriends = async () => {
    setLoadingFriends(true);
    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${selectedChild},receiver_id.eq.${selectedChild}`)
      .eq("status", "approved");

    if (friendships) {
      const friendIds = friendships.map(f =>
        f.requester_id === selectedChild ? f.receiver_id : f.requester_id
      );

      const { data: friendsData } = await supabase
        .from("students")
        .select("id, nickname, display_name")
        .in("id", friendIds);

      setFriends(friendsData || []);
    }

    setLoadingFriends(false);
  };

  const loadBlocks = async () => {
    const { data } = await supabase
      .from("chat_parental_blocks")
      .select("*")
      .eq("student_id", selectedChild)
      .eq("parent_id", parentId);

    if (data) {
      const enrichedBlocks = await Promise.all(
        data.map(async (block) => {
          const { data: friend } = await supabase
            .from("students")
            .select("nickname, display_name")
            .eq("id", block.blocked_friend_id)
            .maybeSingle();

          return {
            ...block,
            friend_name: friend?.nickname || friend?.display_name || "Amigo",
          };
        })
      );

      setBlocks(enrichedBlocks);
    }
  };

  const loadBlockHistory = async () => {
    const { data } = await supabase
      .from("chat_block_history")
      .select("*")
      .eq("student_id", selectedChild)
      .eq("parent_id", parentId)
      .order("blocked_date", { ascending: false });

    setBlockHistory(data || []);
  };

  const calculateTotalBlockedDays = async () => {
    const { data } = await supabase.rpc("count_blocked_days", {
      p_student_id: selectedChild,
      p_friend_id: selectedFriend,
    });

    setTotalBlockedDays(data || 0);
  };

  const handleTemporaryBlock = async () => {
    const days = parseInt(blockDays);
    if (days < 1 || days > 10) {
      toast.error("Seleciona entre 1 e 10 dias");
      return;
    }

    if (totalBlockedDays + days > 10) {
      toast.error(`Limite excedido! Só podes bloquear mais ${10 - totalBlockedDays} dias para este amigo.`);
      return;
    }

    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + days);

    const { error } = await supabase.from("chat_parental_blocks").insert({
      student_id: selectedChild,
      blocked_friend_id: selectedFriend,
      parent_id: parentId,
      blocked_until: blockedUntil.toISOString(),
      is_permanent: false,
      reason: blockReason || null,
    });

    if (error) {
      toast.error("Erro ao bloquear conversa");
    } else {
      toast.success(`Conversa bloqueada por ${days} dia(s)`);
      setShowBlockDialog(false);
      setBlockReason("");
      loadBlocks();
      loadBlockHistory();
    }
  };

  const handlePermanentBlock = async () => {
    if (!window.confirm("Tens a certeza que queres bloquear esta conversa permanentemente?")) {
      return;
    }

    const { error } = await supabase.from("chat_parental_blocks").insert({
      student_id: selectedChild,
      blocked_friend_id: selectedFriend,
      parent_id: parentId,
      blocked_until: null,
      is_permanent: true,
      reason: blockReason || null,
    });

    if (error) {
      toast.error("Erro ao bloquear conversa");
    } else {
      toast.success("Conversa bloqueada permanentemente");
      setShowBlockDialog(false);
      setBlockReason("");
      loadBlocks();
    }
  };

  const handleBlockAllChats = async (isPermanent: boolean) => {
    const duration = isPermanent ? "permanentemente" : `por ${blockDays} dia(s)`;
    if (!window.confirm(`Tens a certeza que queres bloquear TODOS os chats ${duration}?`)) {
      return;
    }

    let blockedUntil = null;
    if (!isPermanent) {
      const days = parseInt(blockDays);
      const untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + days);
      blockedUntil = untilDate.toISOString();
    }

    const { error } = await supabase.from("chat_restrictions").insert({
      student_id: selectedChild,
      parent_id: parentId,
      all_chats_blocked: true,
      blocked_until: blockedUntil,
      is_permanent: isPermanent,
    });

    if (error) {
      toast.error("Erro ao bloquear chats");
    } else {
      toast.success(`Todos os chats bloqueados ${duration}`);
      setShowBlockDialog(false);
    }
  };

  const handleUnblock = async (blockId: string) => {
    if (!window.confirm("Tens a certeza que queres desbloquear esta conversa?")) {
      return;
    }

    const { error } = await supabase
      .from("chat_parental_blocks")
      .delete()
      .eq("id", blockId);

    if (error) {
      toast.error("Erro ao desbloquear");
    } else {
      toast.success("Conversa desbloqueada");
      loadBlocks();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-bold">Gestão de Bloqueios de Chat</h3>
      </div>

      {/* Child selector */}
      <div>
        <Label>Educando</Label>
        <Select value={selectedChild} onValueChange={setSelectedChild}>
          <SelectTrigger>
            <SelectValue placeholder="Seleciona um educando" />
          </SelectTrigger>
          <SelectContent>
            {children.map(child => (
              <SelectItem key={child.id} value={child.id}>
                {child.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedChild && (
        <div className="space-y-4">
          {/* Create new block */}
          <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Ban className="w-4 h-4 mr-2" /> Bloquear Conversa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bloquear Conversa</DialogTitle>
              </DialogHeader>

              <Tabs value={blockType} onValueChange={(v) => setBlockType(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="temporary">Temporário</TabsTrigger>
                  <TabsTrigger value="permanent">Permanente</TabsTrigger>
                  <TabsTrigger value="all">Bloquear Tudo</TabsTrigger>
                </TabsList>

                <TabsContent value="temporary" className="space-y-3">
                  <div>
                    <Label>Amigo</Label>
                    <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleciona um amigo" />
                      </SelectTrigger>
                      <SelectContent>
                        {friends.map(friend => (
                          <SelectItem key={friend.id} value={friend.id}>
                            {friend.nickname || friend.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedFriend && (
                    <div className="bg-muted/30 rounded-lg p-3 text-sm">
                      <p className="text-muted-foreground">
                        Dias já bloqueados: <strong>{totalBlockedDays}/10</strong>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dias disponíveis: {10 - totalBlockedDays}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label>Número de dias (1-10)</Label>
                    <Select value={blockDays} onValueChange={setBlockDays}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                          <SelectItem key={d} value={d.toString()}>
                            {d} {d === 1 ? "dia" : "dias"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Razão (opcional)</Label>
                    <Textarea
                      value={blockReason}
                      onChange={e => setBlockReason(e.target.value)}
                      placeholder="Motivo do bloqueio..."
                      rows={2}
                    />
                  </div>

                  <Button onClick={handleTemporaryBlock} className="w-full" disabled={!selectedFriend}>
                    <Clock className="w-4 h-4 mr-2" /> Bloquear Temporariamente
                  </Button>
                </TabsContent>

                <TabsContent value="permanent" className="space-y-3">
                  <div>
                    <Label>Amigo</Label>
                    <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleciona um amigo" />
                      </SelectTrigger>
                      <SelectContent>
                        {friends.map(friend => (
                          <SelectItem key={friend.id} value={friend.id}>
                            {friend.nickname || friend.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                      <p className="text-xs text-destructive">
                        Bloqueio permanente impede qualquer comunicação com este amigo indefinidamente.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label>Razão (opcional)</Label>
                    <Textarea
                      value={blockReason}
                      onChange={e => setBlockReason(e.target.value)}
                      placeholder="Motivo do bloqueio..."
                      rows={2}
                    />
                  </div>

                  <Button onClick={handlePermanentBlock} variant="destructive" className="w-full" disabled={!selectedFriend}>
                    <Lock className="w-4 h-4 mr-2" /> Bloquear Permanentemente
                  </Button>
                </TabsContent>

                <TabsContent value="all" className="space-y-3">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                      <p className="text-xs text-destructive">
                        Isto irá bloquear TODAS as conversas do educando.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label>Duração</Label>
                    <Select value={blockDays} onValueChange={setBlockDays}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 5, 7, 14, 30].map(d => (
                          <SelectItem key={d} value={d.toString()}>
                            {d} {d === 1 ? "dia" : "dias"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Button onClick={() => handleBlockAllChats(false)} className="w-full">
                      <Clock className="w-4 h-4 mr-2" /> Bloquear Temporariamente
                    </Button>
                    <Button onClick={() => handleBlockAllChats(true)} variant="destructive" className="w-full">
                      <Lock className="w-4 h-4 mr-2" /> Bloquear Permanentemente
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          {/* Active blocks */}
          <div className="game-border bg-card p-4">
            <h4 className="font-display text-md font-bold mb-3">Bloqueios Ativos</h4>
            {blocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum bloqueio ativo.</p>
            ) : (
              <div className="space-y-2">
                {blocks.map(block => (
                  <div key={block.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                    <div className="flex-1">
                      <p className="font-body font-bold text-sm">{block.friend_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {block.is_permanent ? (
                          <span className="text-destructive">Bloqueio permanente</span>
                        ) : (
                          <>Bloqueado até {formatDate(block.blocked_until!)}</>
                        )}
                      </p>
                      {block.reason && (
                        <p className="text-xs text-muted-foreground mt-1">Razão: {block.reason}</p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleUnblock(block.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Block history */}
          <div className="game-border bg-card p-4">
            <h4 className="font-display text-md font-bold mb-3">Histórico de Bloqueios</h4>
            {blockHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum histórico.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {blockHistory.map(item => (
                  <div key={item.id} className="bg-muted/20 rounded-lg p-2 text-xs">
                    <p><strong>{formatDate(item.blocked_date)}</strong> - {item.days_count} dia(s)</p>
                    {item.unblocked_date && (
                      <p className="text-muted-foreground">
                        Desbloqueado: {formatDate(item.unblocked_date)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
