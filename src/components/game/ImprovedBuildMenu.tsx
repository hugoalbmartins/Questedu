import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BUILDING_DEFS, BUILDING_CATEGORIES, BuildingDef, NaturalResourceType } from '@/lib/gameTypes';
import { RESOURCE_INFO } from '@/hooks/useResources';
import { SFX } from '@/lib/sounds';
import { Coins, Diamond, Lock, Crown, CircleCheck as CheckCircle2, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react';

interface ResourceAmounts {
  wood: number; stone: number; iron: number; coal: number; food: number; leather: number; fish: number;
}

interface ImprovedBuildMenuProps {
  selectedBuilding: string | null;
  onSelect: (defId: string | null) => void;
  coins: number;
  diamonds: number;
  villageLevel: number;
  isPremium: boolean;
  district?: string | null;
  resources: ResourceAmounts;
}

export const ImprovedBuildMenu = ({
  selectedBuilding, onSelect, coins, diamonds, villageLevel, isPremium, district, resources,
}: ImprovedBuildMenuProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('infrastructure');
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  const filteredBuildings = Object.values(BUILDING_DEFS).filter(def => {
    if (def.category !== activeCategory) return false;
    if (def.districtExclusive && def.districtExclusive !== district) return false;
    return true;
  });

  const canAffordCurrency = (def: BuildingDef) => coins >= def.costCoins && diamonds >= def.costDiamonds;
  const canAffordResources = (def: BuildingDef) => def.resourceCosts.every(rc => resources[rc.resource] >= rc.amount);
  const canAfford = (def: BuildingDef) => canAffordCurrency(def) && canAffordResources(def);
  const meetsLevel = (def: BuildingDef) => villageLevel >= def.minVillageLevel;
  const meetsAccess = (def: BuildingDef) => !def.premiumOnly || isPremium;

  const getAffordabilityStatus = (def: BuildingDef) => {
    if (!meetsAccess(def)) return 'premium';
    if (!meetsLevel(def)) return 'level';
    if (!canAffordCurrency(def)) return 'currency';
    if (!canAffordResources(def)) return 'resources';
    return 'available';
  };

  return (
    <div className="absolute bottom-16 left-0 right-0 z-30 bg-card/98 backdrop-blur-sm border-t-2 border-border shadow-2xl">
      <div className="flex gap-1 px-2 py-2 overflow-x-auto border-b border-border/50">
        {BUILDING_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); SFX.click(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-bold whitespace-nowrap transition-all
              ${activeCategory === cat.id
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-102'
              }`}
          >
            <span className="text-xl">{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      <ScrollArea className="max-h-48">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-3 py-3">
          {filteredBuildings.map(def => {
            const affordable = canAfford(def);
            const levelOk = meetsLevel(def);
            const accessOk = meetsAccess(def);
            const available = affordable && levelOk && accessOk;
            const isSelected = selectedBuilding === def.id;
            const isHovered = hoveredBuilding === def.id;
            const status = getAffordabilityStatus(def);

            return (
              <button
                key={def.id}
                onClick={() => {
                  if (available) {
                    onSelect(isSelected ? null : def.id);
                    SFX.click();
                  }
                }}
                onMouseEnter={() => setHoveredBuilding(def.id)}
                onMouseLeave={() => setHoveredBuilding(null)}
                className={`relative p-3 rounded-xl border-2 text-center transition-all duration-200
                  ${isSelected ? 'border-primary bg-primary/20 shadow-lg scale-105' : 'border-border bg-card'}
                  ${!available ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary/60 hover:shadow-md cursor-pointer hover:scale-102'}
                `}
              >
                {available && !isSelected && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center shadow-md animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}

                {!accessOk && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gold rounded-full flex items-center justify-center shadow-md">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className="text-4xl mb-2">{def.emoji}</div>
                <div className="text-xs font-body font-bold leading-tight mb-2 h-8 flex items-center justify-center">
                  {def.name}
                </div>

                <div className="space-y-1.5">
                  {def.costCoins > 0 && (
                    <div className={`flex items-center justify-between px-2 py-1 rounded text-xs ${
                      coins >= def.costCoins
                        ? 'bg-secondary/10 border border-secondary/30'
                        : 'bg-destructive/10 border border-destructive/30'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-gold" />
                        <span className="font-bold">{def.costCoins}</span>
                      </div>
                      {coins >= def.costCoins ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-destructive" />
                      )}
                    </div>
                  )}

                  {def.costDiamonds > 0 && (
                    <div className={`flex items-center justify-between px-2 py-1 rounded text-xs ${
                      diamonds >= def.costDiamonds
                        ? 'bg-secondary/10 border border-secondary/30'
                        : 'bg-destructive/10 border border-destructive/30'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Diamond className="w-3.5 h-3.5 text-diamond" />
                        <span className="font-bold">{def.costDiamonds}</span>
                      </div>
                      {diamonds >= def.costDiamonds ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-destructive" />
                      )}
                    </div>
                  )}

                  {def.resourceCosts.map(rc => {
                    const resInfo = RESOURCE_INFO[rc.resource];
                    const hasEnough = resources[rc.resource] >= rc.amount;
                    return (
                      <div
                        key={rc.resource}
                        className={`flex items-center justify-between px-2 py-1 rounded text-xs ${
                          hasEnough
                            ? 'bg-secondary/10 border border-secondary/30'
                            : 'bg-destructive/10 border border-destructive/30'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{resInfo.emoji}</span>
                          <span className="font-bold">{rc.amount}</span>
                        </div>
                        {hasEnough ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <span className="text-[9px] text-destructive font-bold">
                              -{rc.amount - resources[rc.resource]}
                            </span>
                            <XCircle className="w-3.5 h-3.5 text-destructive" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!levelOk && (
                  <div className="mt-2 px-2 py-1 bg-muted rounded text-[10px] font-bold flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Nível {def.minVillageLevel}</span>
                  </div>
                )}

                {isHovered && available && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-secondary text-white text-[10px] font-bold rounded-full whitespace-nowrap shadow-lg">
                    Clica para construir
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      <div className="px-3 py-2 bg-muted/50 border-t border-border/50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-gold" />
            <span className="font-bold">{coins}</span>
          </div>
          <div className="flex items-center gap-1">
            <Diamond className="w-4 h-4 text-diamond" />
            <span className="font-bold">{diamonds}</span>
          </div>
        </div>
        <div className="text-muted-foreground font-body">
          {selectedBuilding ? (
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Clica no mapa para colocar
            </span>
          ) : (
            <span>Seleciona um edifício para construir</span>
          )}
        </div>
      </div>
    </div>
  );
};
