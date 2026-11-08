import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MaterialIcon } from '../common/MaterialIcon';
import { MdSwitch } from '../common/MdControls';
import {
  deleteExtensionData,
  extensionAvailable,
  pingExtension,
  pullExtensionData,
  pushExtensionLists,
  setExtensionEnabled,
} from '../../lib/extension/client';

const ExtensionSettingsCard: React.FC = () => {
  const {
    locale,
    extensionData,
    extensionConnected,
    extensionLists,
    setExtensionSnapshot,
    setExtensionConnected,
    setExtensionLists,
  } = useAppStore();
  const ar = locale === 'ar';
  const available = extensionAvailable();
  const [allowText, setAllowText] = useState(extensionLists.allow.join('\n'));
  const [blockText, setBlockText] = useState(extensionLists.block.join('\n'));
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

  const handleConnect = async () => {
    setBusy(true);
    const ping = await pingExtension();
    if (!ping) {
      setStatus(ar ? 'الإضافة غير مثبتة أو غير متاحة في هذا المتصفح.' : 'Extension not installed or unavailable in this browser.');
    } else if (!ping.trusted) {
      setStatus(ar
        ? 'الإضافة مثبتة لكن هذا الموقع غير مُصرّح له. أضف أصل هذا التطبيق في خيارات الإضافة (trusted origins).'
        : 'Extension found, but this site is not trusted. Add this app\'s origin in the extension options (trusted origins).');
    } else {
      setExtensionConnected(true);
      const snap = await pullExtensionData();
      if (snap) {
        setExtensionSnapshot(snap);
        setExtensionLists(snap.lists);
        setAllowText(snap.lists.allow.join('\n'));
        setBlockText(snap.lists.block.join('\n'));
      }
      // Push locally saved lists so the extension matches the app.
      const local = useAppStore.getState().extensionLists;
      if (local.allow.length || local.block.length) {
        void pushExtensionLists(local.allow, local.block);
      }
      setStatus(ar ? 'تم الاتصال.' : 'Connected.');
    }
    setBusy(false);
  };

  const handleDisconnect = () => {
    setExtensionConnected(false);
    setStatus(ar ? 'تم قطع الاتصال. بياناتك المحلية محفوظة.' : 'Disconnected. Your local copy is kept.');
  };

  const handleSaveLists = async () => {
    const lists = { allow: lines(allowText), block: lines(blockText) };
    setExtensionLists(lists);
    if (extensionConnected) {
      const ok = await pushExtensionLists(lists.allow, lists.block);
      setStatus(ok ? (ar ? 'تم الحفظ والمزامنة مع الإضافة.' : 'Saved and pushed to the extension.') : (ar ? 'حُفظ محلياً (الإضافة غير متصلة).' : 'Saved locally (extension not reachable).'));
    } else {
      setStatus(ar ? 'حُفظ محلياً.' : 'Saved locally.');
    }
  };

  const handleToggleEnabled = async (on: boolean) => {
    if (extensionConnected) await setExtensionEnabled(on);
    if (extensionData) setExtensionSnapshot({ ...extensionData, enabled: on });
  };

  const handleDelete = async () => {
    if (!window.confirm(ar ? 'حذف كل بيانات التتبع في الإضافة؟' : 'Delete all tracking data in the extension?')) return;
    if (extensionConnected) await deleteExtensionData();
    const snap = await pullExtensionData();
    setExtensionSnapshot(snap);
    setStatus(ar ? 'تم حذف البيانات.' : 'Data deleted.');
  };

  return (
    <div
      className="p-6 rounded-3xl border"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderColor: 'var(--md-sys-color-outline-variant)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <MaterialIcon name="sync" size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
        <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
          {ar ? 'إضافة المتصفح' : 'Browser extension'}
        </h2>
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
        {ar
          ? 'Focus Plan Companion اختياري بالكامل. تسجّل الإضافة اسم النطاق فقط (لا محتوى صفحات ولا سجل تصفح) أثناء جلسات التركيز، وتُخزَّن على جهازك. بدونها يعمل التطبيق كاملاً.'
          : 'Focus Plan Companion is fully optional. It records domain names only (never page content or history) during focus sessions, stored on your device. The app works fully without it.'}
      </p>

      {!available && (
        <p className="text-xs mb-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {ar
            ? 'متصفحك لا يدعم رسائل الإضافات. يمكنك استخدام تصدير/استيراد JSON من صفحة خيارات الإضافة.'
            : 'This browser does not expose extension messaging. You can still use JSON export/import from the extension options page.'}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        {extensionConnected ? (
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
            style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
          >
            {ar ? 'قطع الاتصال' : 'Disconnect'}
          </button>
        ) : (
          <button
            onClick={() => void handleConnect()}
            disabled={busy || !available}
            className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
          >
            {busy ? (ar ? 'جارٍ الاتصال…' : 'Connecting…') : (ar ? 'اتصال' : 'Connect')}
          </button>
        )}
        {extensionConnected && (
          <>
            <MdSwitch
              selected={extensionData?.enabled !== false}
              onSelectedChange={(v) => void handleToggleEnabled(v)}
              label={ar ? 'تفعيل التتبع' : 'Tracking enabled'}
            />
            <button
              onClick={() => void pullExtensionData().then((s) => { if (s) { setExtensionSnapshot(s); setStatus(ar ? 'تم التحديث.' : 'Refreshed.'); } })}
              className="px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
              style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {ar ? 'تحديث البيانات' : 'Refresh data'}
            </button>
            <button
              onClick={() => void handleDelete()}
              className="px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
              style={{ borderColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-error)' }}
            >
              {ar ? 'حذف كل البيانات' : 'Delete all data'}
            </button>
          </>
        )}
      </div>

      {(extensionConnected || extensionLists.allow.length > 0 || extensionLists.block.length > 0) && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {ar ? 'مواقع الدراسة (قائمة السماح)' : 'Study sites (allowlist)'}
            </label>
            <textarea
              value={allowText}
              onChange={(e) => setAllowText(e.target.value)}
              rows={3}
              dir="ltr"
              placeholder={'khanacademy.org\nbrilliant.org'}
              className="w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none"
              style={{ backgroundColor: 'var(--md-sys-color-surface-container)', borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {ar ? 'مواقع مشتتة (قائمة الحظر)' : 'Distraction sites (blocklist)'}
            </label>
            <textarea
              value={blockText}
              onChange={(e) => setBlockText(e.target.value)}
              rows={3}
              dir="ltr"
              placeholder={'youtube.com\ntiktok.com'}
              className="w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none"
              style={{ backgroundColor: 'var(--md-sys-color-surface-container)', borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
            />
          </div>
          <button
            onClick={() => void handleSaveLists()}
            className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
          >
            {ar ? 'حفظ القوائم' : 'Save lists'}
          </button>
        </div>
      )}

      {status && (
        <p className="text-xs mt-3 font-semibold" style={{ color: 'var(--md-sys-color-primary)' }} role="status">
          {status}
        </p>
      )}
    </div>
  );
};

export default ExtensionSettingsCard;
