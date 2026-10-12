import type { ReactNode } from 'react';
import {
  Bookmark,
  Disc3,
  Globe,
  Handshake,
  Info,
  Link2,
  Mic,
  Monitor,
  MonitorSmartphone,
  Newspaper,
  Scale,
  Search,
  Smartphone,
  Tablet,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { DeviceKind, PageKind, SourceKind } from './stats-labels';

const pageIcons: Record<Exclude<PageKind, 'home' | 'store'>, LucideIcon> = {
  release: Disc3,
  artists: Users,
  artist: Mic,
  news: Newspaper,
  services: Handshake,
  about: Info,
  legal: Scale,
  other: Link2,
};
const deviceIcons: Record<DeviceKind, LucideIcon> = {
  phone: Smartphone,
  desktop: Monitor,
  tablet: Tablet,
  other: MonitorSmartphone,
};

export function PageIcon({ kind }: { kind: PageKind }) {
  if (kind === 'home') return lucideHouse();
  if (kind === 'store') return lucideShoppingBag();
  const Icon = pageIcons[kind];
  return <Icon className="stats-row-icon" aria-hidden="true" />;
}

export function DeviceIcon({ kind }: { kind: DeviceKind }) {
  const Icon = deviceIcons[kind];
  return <Icon className="stats-row-icon" aria-hidden="true" />;
}

const mark = (children: ReactNode, stroke = false) => (
  <svg
    className="stats-row-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    {...(stroke
      ? {
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
        }
      : { fill: 'currentColor' })}
  >
    {children}
  </svg>
);

// Lucide (ISC) House and ShoppingBag, inlined so Stats does not split the shell's shared icon chunks.
const lucideHouse = () =>
  mark(
    <>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>,
    true,
  );
const lucideShoppingBag = () =>
  mark(
    <>
      <path d="M16 10a4 4 0 0 1-8 0" />
      <path d="M3.103 6.034h17.794" />
      <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
    </>,
    true,
  );

// Monochrome brand marks drawn in currentColor. Instagram, Facebook, Linktree and Bandcamp are copied from
// apps/web/src/components/icons; Google, YouTube and DuckDuckGo are Simple Icons (CC0) 13.21.0 paths.
// Simple Icons has no Bing mark, so Bing uses the lucide Search icon.
const brandMarks: Partial<Record<SourceKind, () => ReactNode>> = {
  instagram: () =>
    mark(
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37a4 4 0 1 1-7.75 1.26 4 4 0 0 1 7.75-1.26z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </>,
      true,
    ),
  facebook: () => mark(<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />, true),
  linktree: () =>
    mark(
      <path d="m13.73635 5.85251 4.00467-4.11665 2.3248 2.3808-4.20064 4.00466h5.9085v3.30473h-5.9365l4.22865 4.10766-2.3248 2.3338L12.0005 12.099l-5.74052 5.76852-2.3248-2.3248 4.22864-4.10766h-5.9375V8.12132h5.9085L3.93417 4.11666l2.3248-2.3808 4.00468 4.11665V0h3.4727zm-3.4727 10.30614h3.4727V24h-3.4727z" />,
    ),
  bandcamp: () => mark(<path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />),
  google: () =>
    mark(
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />,
    ),
  youtube: () =>
    mark(
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
    ),
  duckduckgo: () =>
    mark(
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 23C5.925 23 1 18.074 1 12S5.926 1 12 1s11 4.925 11 11-4.925 11-11 11zm10.219-11c0 4.805-3.317 8.833-7.786 9.925-.27-.521-.53-1.017-.749-1.438.645.249 1.93.718 2.208.615.376-.144.282-3.149-.14-3.245-.338-.075-1.632.837-2.141 1.209l.034.156c.078.397.144.993.03 1.247-.001.004-.002.01-.004.013a.218.218 0 0 1-.068.088c-.284.188-1.081.284-1.503.188a.516.516 0 0 1-.064-.02c-.694.396-2.01 1.109-2.25.971-.329-.188-.377-2.676-.329-3.288.035-.46 1.653.286 2.442.679.174-.163.602-.272.98-.31-.57-1.389-.99-2.977-.733-4.105 0 .002.002.002.002.002.356.248 2.73 1.05 3.91 1.027 1.18-.024 3.114-.743 2.903-1.323-.212-.58-2.135.51-4.142.324-1.486-.138-1.748-.804-1.42-1.29.414-.611 1.168.116 2.411-.256 1.245-.371 2.987-1.035 3.632-1.397 1.494-.833-.625-1.177-1.125-.947-.474.22-2.123.637-2.889.82.428-1.516-.603-4.149-1.757-5.3-.376-.376-.951-.612-1.603-.736-.25-.344-.654-.671-1.225-.977a5.772 5.772 0 0 0-3.595-.584l-.024.004-.034.004.004.002c-.148.028-.237.08-.357.098.148.016.705.276 1.057.418-.174.068-.412.108-.596.184a.828.828 0 0 0-.204.056c-.173.08-.303.375-.3.515.84-.086 2.082-.026 2.991.246-.644.09-1.235.258-1.661.482-.016.008-.03.018-.048.028-.054.02-.106.042-.152.066-1.367.72-1.971 2.405-1.611 4.424.323 1.824 1.665 8.088 2.29 11.064-3.973-1.4-6.822-5.186-6.822-9.639C1.781 6.356 6.356 1.781 12 1.781S22.219 6.356 22.219 12zM9.095 9.581a.758.758 0 1 0 0 1.516.758.758 0 0 0 0-1.516zm.338.702a.196.196 0 1 1 0-.392.196.196 0 0 1 0 .392zm4.724-1.043a.65.65 0 1 0 0 1.299.65.65 0 0 0 0-1.3zm.29.601a.168.168 0 1 1 0-.336.168.168 0 0 1 0 .336zM9.313 8.146s-.571-.26-1.125.09c-.554.348-.534.704-.534.704s-.294-.656.49-.978c.786-.32 1.17.184 1.17.184zm5.236-.052s-.41-.234-.73-.23c-.654.008-.831.296-.831.296s.11-.688.945-.55a.84.84 0 0 1 .616.484z" />,
    ),
};

export function SourceIcon({ kind }: { kind: SourceKind }) {
  const brand = brandMarks[kind];
  if (brand) return brand();
  const Icon = kind === 'direct' ? Bookmark : kind === 'bing' ? Search : Globe;
  return <Icon className="stats-row-icon" aria-hidden="true" />;
}
