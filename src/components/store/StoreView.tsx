import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { STORE_ITEMS, StoreItem } from '../../lib/coinsEngine';
import { MaterialIcon } from '../common/MaterialIcon';

export const StoreView: React.FC = () => {
  const { locale, coins, inventory, transactions, purchaseItem } = useAppStore();
  const t = TRANSLATIONS[locale];
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleBuy = (item: StoreItem) => {
    const success = purchaseItem(item);
    if (success) {
      setFeedbackMsg(t.store.purchasedSuccess);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setFeedbackMsg(t.store.insufficientCoins);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Title & Coin Balance Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-2xl font-bold font-display"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {t.store.title}
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            {locale === 'ar'
              ? 'استبدل عملات ونقاط التركيز بمكافآت دراسية مثل تجميد السلسلة ومضاعف الاستراحة.'
              : 'Redeem your earned focus coins for streak shields, break boosters, and themes.'}
          </p>
        </div>

        {/* Coins Badge */}
        <div
          className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border self-start sm:self-auto shadow-sm"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
            }}
          >
            <MaterialIcon name="monetization_on" size={20} className="text-amber-500" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--md-sys-color-outline)' }}>
              {t.store.coinsBalance}
            </div>
            <div className="text-xl font-timer font-bold tabular-nums" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {coins}
            </div>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className="p-3.5 mb-6 rounded-xl border text-xs font-semibold text-center transition-all animate-in fade-in"
          style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            borderColor: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary-container)',
          }}
        >
          {feedbackMsg}
        </div>
      )}

      {/* Store Items Grid */}
      <div className="mb-10">
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: 'var(--md-sys-color-on-surface)' }}
        >
          {t.store.items}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STORE_ITEMS.map((item) => {
            const ownedCount = inventory[item.id] || 0;
            const title = (t.store as any)[item.titleKey] || item.titleKey;
            const desc = (t.store as any)[item.descKey] || item.descKey;
            const canAfford = coins >= item.price;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                        color: 'var(--md-sys-color-primary)',
                      }}
                    >
                      <MaterialIcon name={item.icon} size={22} />
                    </div>

                    {ownedCount > 0 && (
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: 'var(--md-sys-color-secondary-container)',
                          color: 'var(--md-sys-color-on-secondary-container)',
                        }}
                      >
                        {t.store.owned}: {ownedCount}
                      </span>
                    )}
                  </div>

                  <h3
                    className="text-base font-bold mb-1"
                    style={{ color: 'var(--md-sys-color-on-surface)' }}
                  >
                    {title}
                  </h3>

                  <p
                    className="text-xs mb-4 line-clamp-2"
                    style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                  >
                    {desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                  <div className="flex items-center gap-1 font-timer font-bold text-sm tabular-nums">
                    <span>{item.price}</span>
                    <span className="text-xs font-normal" style={{ color: 'var(--md-sys-color-outline)' }}>
                      {t.store.price}
                    </span>
                  </div>

                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-transform active:scale-95 disabled:opacity-40"
                    style={{
                      backgroundColor: 'var(--md-sys-color-primary)',
                      color: 'var(--md-sys-color-on-primary)',
                    }}
                  >
                    {t.store.buy}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History Log */}
      <div
        className="rounded-3xl p-6 border"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <h2
          className="text-base font-bold mb-4"
          style={{ color: 'var(--md-sys-color-on-surface)' }}
        >
          {locale === 'ar' ? 'سجل العمليات والعملات' : 'Transaction History'}
        </h2>

        {transactions.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--md-sys-color-outline)' }}>
            {locale === 'ar' ? 'لا توجد معاملات بعد.' : 'No transactions recorded yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl border text-xs"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                <div>
                  <div className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {tx.reason}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--md-sys-color-outline)' }}>
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>

                <div
                  className={`font-timer font-bold tabular-nums text-sm ${
                    tx.type === 'earn' ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
