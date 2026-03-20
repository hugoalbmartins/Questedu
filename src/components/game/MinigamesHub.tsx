import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MemoryGameModal } from "@/components/game/MemoryGameModal";
import { Gamepad2, Brain, Lock } from "lucide-react";

interface MinigamesHubProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  schoolYear: string | number;
  isPremium?: boolean;
}

const MINIGAMES = [
  {
    id: "memory",
    title: "Jogo da Memória",
    description: "Associa perguntas às respostas corretas em tempo limite.",
    emoji: "🧠",
    premium: false,
  },
  {
    id: "speed",
    title: "Modo Velocidade",
    description: "Em breve — responde o mais rápido possível a perguntas rápidas.",
    emoji: "⚡",
    premium: true,
    comingSoon: true,
  },
  {
    id: "puzzle",
    title: "Puzzle de Palavras",
    description: "Em breve — ordena letras para completar termos académicos.",
    emoji: "🔤",
    premium: true,
    comingSoon: true,
  },
];

export const MinigamesHub = ({
  isOpen,
  onClose,
  studentId,
  schoolYear,
  isPremium,
}: MinigamesHubProps) => {
  const [openMemory, setOpenMemory] = useState(false);

  const handleLaunch = (id: string) => {
    if (id === "memory") {
      onClose();
      setOpenMemory(true);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-xl">
              <Gamepad2 className="w-5 h-5 text-amber-500" />
              Minijogos Educativos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {MINIGAMES.map((game) => {
              const locked = game.premium && !isPremium;
              const comingSoon = game.comingSoon;

              return (
                <div
                  key={game.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                    locked || comingSoon
                      ? "border-slate-200 bg-slate-50 opacity-70"
                      : "border-amber-200 bg-amber-50 hover:border-amber-400 cursor-pointer"
                  }`}
                >
                  <span className="text-3xl leading-none mt-0.5">{game.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-slate-900 text-sm">{game.title}</p>
                      {comingSoon && (
                        <Badge variant="outline" className="text-xs">Em breve</Badge>
                      )}
                      {locked && !comingSoon && (
                        <Badge className="bg-amber-500 text-white text-xs">Premium</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{game.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {comingSoon ? (
                      <Lock className="w-4 h-4 text-slate-400" />
                    ) : locked ? (
                      <Lock className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Button
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => handleLaunch(game.id)}
                      >
                        Jogar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <MemoryGameModal
        isOpen={openMemory}
        onClose={() => setOpenMemory(false)}
        studentId={studentId}
        schoolYear={typeof schoolYear === "string" ? parseInt(schoolYear) : schoolYear}
      />
    </>
  );
};
