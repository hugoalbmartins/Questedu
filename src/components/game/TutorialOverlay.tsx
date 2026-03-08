import { useState, useEffect, useCallback } from 'react';
import { BUILDING_DEFS } from '@/lib/gameTypes';
import { Button } from '@/components/ui/button';
import { ChevronRight, X, MapPin, Home, Wheat } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  emoji: string;
  icon: React.ReactNode;
  targetBuilding: string;
  hint: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'road',
    title: 'Constrói uma Estrada',
    description: 'As estradas ligam os edifícios e permitem que os cidadãos se movam. Seleciona "Estrada" no menu de construção e coloca-a no mapa.',
    emoji: '🛤️',
    icon: <MapPin className="w-5 h-5" />,
    targetBuilding: 'road',
    hint: 'Clica no menu de construção em baixo → Infraestrutura → Estrada',
  },
  {
    id: 'house',
    title: 'Constrói uma Casa',
    description: 'As casas atraem cidadãos para a tua aldeia. Precisam de estar junto a uma estrada!',
    emoji: '🏠',
    icon: <Home className="w-5 h-5" />,
    targetBuilding: 'house',
    hint: 'Menu de construção → Residencial → Casa (coloca junto à estrada)',
  },
  {
    id: 'farm',
    title: 'Constrói uma Horta',
    description: 'A horta produz alimentos para alimentar a tua população. Sem comida, os cidadãos abandonam a aldeia!',
    emoji: '🌾',
    icon: <Wheat className="w-5 h-5" />,
    targetBuilding: 'farm',
    hint: 'Menu de construção → Produção → Horta (2×2, precisa de estrada)',
  },
];

const TUTORIAL_STORAGE_KEY = 'village_tutorial_complete';

interface TutorialOverlayProps {
  buildings: { defId: string }[];
  onSelectBuilding: (id: string) => void;
}

export const TutorialOverlay = ({ buildings, onSelectBuilding }: TutorialOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true') {
      setCompleted(true);
    }
  }, []);

  // Auto-advance when the target building is placed
  useEffect(() => {
    if (completed || dismissed) return;
    const step = TUTORIAL_STEPS[currentStep];
    if (!step) return;

    const hasBuilding = buildings.some(b => b.defId === step.targetBuilding);
    if (hasBuilding) {
      if (currentStep < TUTORIAL_STEPS.length - 1) {
        setTimeout(() => setCurrentStep(prev => prev + 1), 800);
      } else {
        // Tutorial complete
        setTimeout(() => {
          setCompleted(true);
          localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
        }, 800);
      }
    }
  }, [buildings, currentStep, completed, dismissed]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  }, []);

  if (completed || dismissed) return null;

  const step = TUTORIAL_STEPS[currentStep];
  if (!step) return null;

  const stepDone = buildings.some(b => b.defId === step.targetBuilding);

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-sm">
      <div className="bg-card/95 backdrop-blur-md rounded-xl border-2 border-primary/40 shadow-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{step.emoji}</span>
            <div>
              <p className="text-[10px] text-muted-foreground font-body">
                Passo {currentStep + 1}/{TUTORIAL_STEPS.length}
              </p>
              <h3 className="font-display text-sm font-bold">{step.title}</h3>
            </div>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleDismiss}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="flex gap-1">
          {TUTORIAL_STEPS.map((s, i) => {
            const done = i < currentStep || (i === currentStep && stepDone);
            return (
              <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                done ? 'bg-primary' : i === currentStep ? 'bg-primary/40' : 'bg-muted'
              }`} />
            );
          })}
        </div>

        {/* Description */}
        <p className="text-xs font-body text-muted-foreground">{step.description}</p>

        {/* Action */}
        {!stepDone ? (
          <div className="flex items-center gap-2">
            <Button size="sm" className="flex-1 text-xs" onClick={() => onSelectBuilding(step.targetBuilding)}>
              {step.icon}
              <span className="ml-1">Selecionar {BUILDING_DEFS[step.targetBuilding]?.name}</span>
              <ChevronRight className="w-3 h-3 ml-auto" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-body text-primary font-bold">
            <span>✅</span> Feito! A avançar...
          </div>
        )}

        {/* Hint */}
        <p className="text-[10px] text-muted-foreground italic border-t border-border pt-2">
          💡 {step.hint}
        </p>

        {/* Skip */}
        <button onClick={handleDismiss} className="text-[10px] text-muted-foreground underline hover:text-foreground transition-colors">
          Saltar tutorial
        </button>
      </div>
    </div>
  );
};
