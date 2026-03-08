import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EXPANSION_LEVELS } from '@/lib/gameTypes';
import { Coins, Diamond, Check, Lock, ArrowRight } from 'lucide-react';

interface ExpansionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSize: number;
  coins: number;
  diamonds: number;
  onExpand: () => void;
}

export const ExpansionPanel = ({
  open, onOpenChange, currentSize, coins, diamonds, onExpand,
}: ExpansionPanelProps) => {
  const currentIdx = EXPANSION_LEVELS.findIndex(l => l.size === currentSize);
  const nextLevel = currentIdx < EXPANSION_LEVELS.length - 1 ? EXPANSION_LEVELS[currentIdx + 1] : null;
  const canAfford = nextLevel ? coins >= nextLevel.cost && diamonds >= nextLevel.diamonds : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            🗺️ Expansão do Território
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {EXPANSION_LEVELS.map((level, idx) => {
            const isUnlocked = level.size <= currentSize;
            const isCurrent = level.size === currentSize;
            const isNext = idx === currentIdx + 1;

            return (
              <div
                key={level.size}
                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors
                  ${isCurrent ? 'border-primary bg-primary/10' : isUnlocked ? 'border-secondary/50 bg-secondary/5' : 'border-border bg-muted/30'}
                `}
              >
                <div className="flex items-center gap-2">
                  {isUnlocked ? (
                    <Check className="w-4 h-4 text-secondary" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div>
                    <div className="text-sm font-body font-bold">{level.size}×{level.size}</div>
                    <div className="text-[10px] text-muted-foreground">{level.label}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {level.cost > 0 && (
                    <span className="flex items-center gap-0.5 text-xs">
                      <Coins className="w-3 h-3 text-gold" />{level.cost}
                    </span>
                  )}
                  {level.diamonds > 0 && (
                    <span className="flex items-center gap-0.5 text-xs">
                      <Diamond className="w-3 h-3 text-diamond" />{level.diamonds}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-primary">ATUAL</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {nextLevel ? (
          <Button
            className="w-full mt-2"
            disabled={!canAfford}
            onClick={onExpand}
          >
            <ArrowRight className="w-4 h-4 mr-1" />
            Expandir para {nextLevel.size}×{nextLevel.size}
            <span className="ml-2 flex items-center gap-1">
              {nextLevel.cost > 0 && <><Coins className="w-3 h-3" />{nextLevel.cost}</>}
              {nextLevel.diamonds > 0 && <><Diamond className="w-3 h-3 ml-1" />{nextLevel.diamonds}</>}
            </span>
          </Button>
        ) : (
          <div className="text-center text-sm font-bold text-gold py-2">
            ⭐ Território Máximo Atingido!
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
