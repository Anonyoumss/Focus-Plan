export interface StoreItem {
  id: string;
  titleKey: string;
  descKey: string;
  price: number;
  icon: string;
  category: 'boost' | 'cosmetic' | 'shield';
}

export interface CoinTransaction {
  id: string;
  timestamp: number;
  amount: number;
  type: 'earn' | 'spend';
  reason: string;
}

export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'streak_freeze',
    titleKey: 'streakFreezeTitle',
    descKey: 'streakFreezeDesc',
    price: 10,
    icon: 'ac_unit',
    category: 'shield',
  },
  {
    id: 'break_multiplier',
    titleKey: 'breakMultiplierTitle',
    descKey: 'breakMultiplierDesc',
    price: 25,
    icon: 'hourglass_top',
    category: 'boost',
  },
  {
    id: 'palette_token',
    titleKey: 'colorThemeTitle',
    descKey: 'colorThemeDesc',
    price: 15,
    icon: 'palette',
    category: 'cosmetic',
  },
];

export function canPurchaseItem(currentCoins: number, itemPrice: number): boolean {
  return currentCoins >= itemPrice;
}

export function processPurchase(
  currentCoins: number,
  inventory: Record<string, number>,
  item: StoreItem
): { newCoins: number; newInventory: Record<string, number>; transaction: CoinTransaction } | null {
  if (!canPurchaseItem(currentCoins, item.price)) {
    return null;
  }

  const newCoins = currentCoins - item.price;
  const newInventory = {
    ...inventory,
    [item.id]: (inventory[item.id] || 0) + 1,
  };

  const transaction: CoinTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    amount: -item.price,
    type: 'spend',
    reason: `Purchased ${item.titleKey}`,
  };

  return { newCoins, newInventory, transaction };
}

export function awardPoints(
  currentCoins: number,
  points: number,
  reason: string
): { newCoins: number; transaction: CoinTransaction } {
  const newCoins = currentCoins + points;
  const transaction: CoinTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    amount: points,
    type: 'earn',
    reason,
  };
  return { newCoins, transaction };
}
