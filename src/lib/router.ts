import { TabDestination } from '../store/useAppStore';

export type AppRoute =
  | { name: 'landing' }
  | { name: 'app'; tab: TabDestination }
  | { name: 'invite'; code: string }
  | { name: 'referral'; code: string };

const APP_TABS: TabDestination[] = [
  'focus',
  'plan',
  'tests',
  'progress',
  'friends',
  'store',
  'settings',
  'terms',
  'privacy',
];

export function parseHashRoute(hash: string): AppRoute {
  const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  if (!path) return { name: 'landing' };

  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'app') {
    const tab = segments[1] as TabDestination | undefined;
    if (tab && APP_TABS.includes(tab)) return { name: 'app', tab };
    return { name: 'app', tab: 'focus' };
  }

  if (segments[0] === 'terms') return { name: 'app', tab: 'terms' };
  if (segments[0] === 'privacy') return { name: 'app', tab: 'privacy' };

  if (segments[0] === 'invite' && segments[1]) {
    return { name: 'invite', code: decodeURIComponent(segments[1]) };
  }

  if (segments[0] === 'referral' && segments[1]) {
    return { name: 'referral', code: decodeURIComponent(segments[1]) };
  }

  return { name: 'landing' };
}

export function routeToHash(route: AppRoute): string {
  switch (route.name) {
    case 'landing':
      return '#/';
    case 'app':
      if (route.tab === 'terms') return '#/terms';
      if (route.tab === 'privacy') return '#/privacy';
      return route.tab === 'focus' ? '#/app' : `#/app/${route.tab}`;
    case 'invite':
      return `#/invite/${encodeURIComponent(route.code)}`;
    case 'referral':
      return `#/referral/${encodeURIComponent(route.code)}`;
  }
}

export function navigateTo(route: AppRoute) {
  const hash = routeToHash(route);
  if (window.location.hash === hash) return;
  window.location.hash = hash;
}

export function navigateToAppTab(tab: TabDestination) {
  navigateTo({ name: 'app', tab });
}

export function subscribeToHash(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}
