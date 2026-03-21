import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BUILDING_DEFS, BUILDING_CATEGORIES, BuildingDef, NaturalResourceType } from '@/lib/gameTypes';
import { RESOURCE_INFO } from '@/hooks/useResources';
import { SFX } from '@/lib/sounds';
import { Coins, Diamond, Lock, Crown } from 'lucide-react';

interface ResourceAmounts {
  wood: number; stone: number; iron: number; coal: number; food: number; leather: number; fish: number;
}

interface BuildMenuProps {
  selectedBuilding: string | null;
  onSelect: (defId: string | null) => void;
  coins: number;
  diamonds: number;
  villageLevel: number;
  isPremium: boolean;
  district?: string | null;
  resources: ResourceAmounts;
}

export const BuildMenu = ({
  selectedBuilding, onSelect, coins, diamonds, villageLevel, isPremium, district, resources,
}: BuildMenuProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('infrastructure');

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

  return (
    <div
      className="absolute bottom-16 left-0 right-0 z-30 bg-card/95 backdrop-blur-sm border-t-2 border-border"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="flex gap-1 px-2 py-1.5"
        style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
      >
        {BUILDING_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); SFX.click(); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-body font-semibold whitespace-nowrap transition-colors flex-shrink-0
              ${activeCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      <div
        className="max-h-40"
        style={{ overflowX: 'auto', overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
      >
        <div className="flex gap-2 px-2 py-2" style={{ minWidth: 'max-content' }}>
          {filteredBuildings.map(def => {
            const affordable = canAfford(def);
            const levelOk = meetsLevel(def);
            const accessOk = meetsAccess(def);
            const available = affordable && levelOk && accessOk;
            const isSelected = selectedBuilding === def.id;

            return (
              <button
                key={def.id}
                onClick={() => {
                  if (available) {
                    onSelect(isSelected ? null : def.id);
                    SFX.click();
                  }
                }}
                className={`flex-shrink-0 w-24 p-2 rounded-lg border-2 text-center transition-all
                  ${isSelected ? 'border-primary bg-primary/10 scale-105' : 'border-border bg-card'}
                  ${!available ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 cursor-pointer'}
                `}
              >
                <div className="text-2xl mb-0.5">{def.emoji}</div>
                <div className="text-[10px] font-body font-bold leading-tight truncate">{def.name}</div>
                <div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
                  {def.costCoins > 0 && (
                    <span className={`flex items-center gap-0.5 text-[9px] ${coins < def.costCoins ? 'text-destructive' : ''}`}>
                      <Coins className="w-2.5 h-2.5 text-gold" />{def.costCoins}
                    </span>
                  )}
                  {def.costDiamonds > 0 && (
                    <span className={`flex items-center gap-0.5 text-[9px] ${diamonds < def.costDiamonds ? 'text-destructive' : ''}`}>
                      <Diamond className="w-2.5 h-2.5 text-diamond" />{def.costDiamonds}
                    </span>
                  )}
                </div>
                {def.resourceCosts.length > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
                    {def.resourceCosts.map(rc => {
                      const info = RESOURCE_INFO[rc.resource];
                      const hasEnough = resources[rc.resource] >= rc.amount;
                      return (
                        <span key={rc.resource} className={`flex items-center gap-0.5 text-[8px] ${!hasEnough ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                          {info.emoji}{rc.amount}
                        </span>
                      );
                    })}
                  </div>
                )}
                {!accessOk && <Crown className="w-3 h-3 mx-auto mt-0.5 text-gold" />}
                {!levelOk && accessOk && <Lock className="w-3 h-3 mx-auto mt-0.5 text-muted-foreground" />}
              </button>
            );
          })}
          {filteredBuildings.length === 0 && (
            <p className="text-xs text-muted-foreground px-4 py-2 font-body">
              Nenhuma construção disponível nesta categoria.
            </p>
          )}
        </div>
      </div>

      {selectedBuilding && (
        <div className="px-2 pb-2">
          <Button
            size="sm"
            variant="destructive"
            className="w-full text-xs"
            onClick={() => { onSelect(null); SFX.click(); }}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
};
