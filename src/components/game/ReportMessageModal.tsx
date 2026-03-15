import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CircleAlert as AlertCircle, Flag } from "lucide-react";

interface ReportMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  reportedUserId: string;
  reportedUserName: string;
}

const REPORT_REASONS = [
  { value: "profanity", label: "Linguagem inapropriada" },
  { value: "bullying", label: "Bullying ou assédio" },
  { value: "spam", label: "Spam ou publicidade" },
  { value: "personal_info", label: "Partilha de informação pessoal" },
  { value: "inappropriate_content", label: "Conteúdo inadequado" },
  { value: "other", label: "Outro motivo" },
];

export function ReportMessageModal({
  isOpen,
  onClose,
  messageId,
  reportedUserId,
  reportedUserName,
}: ReportMessageModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({
        title: "Seleciona um motivo",
        description: "Por favor, escolhe o motivo da denúncia.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!studentData) throw new Error("Estudante não encontrado");

      const reasonText = REPORT_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
      const fullReason = additionalDetails
        ? `${reasonText} - ${additionalDetails}`
        : reasonText;

      const { error } = await supabase
        .from("message_reports")
        .insert({
          reporter_id: studentData.id,
          reported_message_id: messageId,
          reported_user_id: reportedUserId,
          reason: fullReason,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Denúncia enviada",
        description: "A tua denúncia foi enviada. Um adulto responsável irá analisá-la.",
      });

      onClose();
      setSelectedReason("");
      setAdditionalDetails("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Erro ao enviar denúncia",
        description: "Ocorreu um erro. Por favor, tenta novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Denunciar Mensagem
          </DialogTitle>
          <DialogDescription>
            Estás a denunciar uma mensagem de <strong>{reportedUserName}</strong>.
            Esta denúncia será analisada por um adulto responsável.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Motivo da denúncia</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {REPORT_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Detalhes adicionais (opcional)</Label>
            <Textarea
              id="details"
              placeholder="Descreve o que aconteceu..."
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              As denúncias falsas ou abusivas podem resultar em consequências.
              Por favor, usa esta ferramenta de forma responsável.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "A enviar..." : "Enviar Denúncia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
