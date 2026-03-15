import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, CreditCard as Edit, Save, Award, Target, Clock, TrendingUp, Sparkles } from "lucide-react";

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentData: any;
}

interface ProfileData {
  bio: string | null;
  motto: string | null;
  favorite_subject: string | null;
  profile_theme: string;
  avatar_config: any;
  active_title: string | null;
  is_profile_public: boolean;
  total_playtime_minutes: number;
}

export function StudentProfileModal({
  isOpen,
  onClose,
  studentId,
  studentData,
}: StudentProfileModalProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen, studentId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfile(data);
        setEditedProfile(data);
      } else {
        const defaultProfile: ProfileData = {
          bio: null,
          motto: null,
          favorite_subject: null,
          profile_theme: "default",
          avatar_config: {},
          active_title: null,
          is_profile_public: false,
          total_playtime_minutes: 0,
        };
        setProfile(defaultProfile);
        setEditedProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("student_profiles")
        .upsert({
          student_id: studentId,
          bio: editedProfile.bio,
          motto: editedProfile.motto,
          favorite_subject: editedProfile.favorite_subject,
          is_profile_public: editedProfile.is_profile_public,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      setProfile(editedProfile as ProfileData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Erro ao guardar perfil");
    } finally {
      setSaving(false);
    }
  };

  const getSubjectLabel = (subject: string | null) => {
    const labels: Record<string, string> = {
      matematica: "Matemática",
      portugues: "Português",
      estudo_meio: "Estudo do Meio",
      ingles: "Inglês",
    };
    return subject ? labels[subject] || subject : "Não definida";
  };

  const formatPlaytime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="py-8 text-center">
            <p className="text-lg">A carregar perfil...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <User className="w-6 h-6 text-primary" />
            Perfil de {studentData?.name}
          </DialogTitle>
          <DialogDescription>
            Personaliza o teu perfil e mostra as tuas conquistas!
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="edit">Editar Perfil</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl">
                    {studentData?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      {studentData?.name}
                    </h3>
                    {profile?.active_title && (
                      <Badge variant="secondary" className="mb-2">
                        <Award className="w-3 h-3 mr-1" />
                        {profile.active_title}
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {studentData?.school_year}º Ano
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">
                    Nível {Math.floor((studentData?.xp || 0) / 1000) + 1}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {studentData?.xp || 0} XP
                  </p>
                </div>
              </div>

              {profile?.motto && (
                <div className="mb-4 p-4 bg-muted rounded-lg border-l-4 border-primary">
                  <p className="italic text-lg">"{profile.motto}"</p>
                </div>
              )}

              {profile?.bio && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Sobre mim:</h4>
                  <p className="text-muted-foreground">{profile.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">Disciplina Favorita</span>
                  </div>
                  <p className="text-lg">
                    {getSubjectLabel(profile?.favorite_subject)}
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-purple-500" />
                    <span className="font-semibold">Tempo de Jogo</span>
                  </div>
                  <p className="text-lg">
                    {formatPlaytime(profile?.total_playtime_minutes || 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Recursos Atuais
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">
                    {studentData?.coins || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Moedas 🪙</p>
                </div>
                <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {studentData?.diamonds || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Diamantes 💎</p>
                </div>
                <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">
                    {studentData?.xp || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">XP ⭐</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="edit" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Editar Informações
                </h4>
                {isEditing && (
                  <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm">
                    Cancelar
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="motto">Lema Pessoal</Label>
                  <Input
                    id="motto"
                    value={editedProfile.motto || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, motto: e.target.value })
                    }
                    placeholder="Ex: Aprender é uma aventura!"
                    maxLength={100}
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(editedProfile.motto || "").length}/100 caracteres
                  </p>
                </div>

                <div>
                  <Label htmlFor="bio">Sobre ti</Label>
                  <Textarea
                    id="bio"
                    value={editedProfile.bio || ""}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, bio: e.target.value })
                    }
                    placeholder="Conta um pouco sobre ti e o que gostas de aprender..."
                    maxLength={500}
                    rows={4}
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(editedProfile.bio || "").length}/500 caracteres
                  </p>
                </div>

                <div>
                  <Label htmlFor="favorite_subject">Disciplina Favorita</Label>
                  <select
                    id="favorite_subject"
                    value={editedProfile.favorite_subject || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        favorite_subject: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Seleciona...</option>
                    <option value="matematica">Matemática</option>
                    <option value="portugues">Português</option>
                    <option value="estudo_meio">Estudo do Meio</option>
                    <option value="ingles">Inglês</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Perfil
                    </Button>
                  ) : (
                    <Button
                      onClick={saveProfile}
                      disabled={saving}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "A guardar..." : "Guardar Alterações"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Estatísticas de Progresso
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-muted rounded">
                  <span>Tempo Total de Jogo:</span>
                  <span className="font-bold">
                    {formatPlaytime(profile?.total_playtime_minutes || 0)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded">
                  <span>Nível Atual:</span>
                  <span className="font-bold">
                    {Math.floor((studentData?.xp || 0) / 1000) + 1}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded">
                  <span>XP Total:</span>
                  <span className="font-bold">{studentData?.xp || 0}</span>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded">
                  <span>Moedas Totais:</span>
                  <span className="font-bold">{studentData?.coins || 0} 🪙</span>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded">
                  <span>Diamantes Totais:</span>
                  <span className="font-bold">{studentData?.diamonds || 0} 💎</span>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
