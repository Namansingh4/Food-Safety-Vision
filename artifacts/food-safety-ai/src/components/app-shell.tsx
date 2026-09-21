import { FlaskConical, BookOpenText, LayoutDashboard, ArrowUpRight } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isMethodology = location === '/methodology';

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-24 items-center gap-3 border-b border-sidebar-border px-7">
          <div className="brand-mark"><FlaskConical size={20} strokeWidth={2.4} /></div>
          <div>
            <div className="font-display text-[15px] font-bold tracking-tight">Food Safety AI</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/55">field notebook / 01</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-7">
          <div className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/45">Workspace</div>
          <Link data-testid="link-workspace" href="/" className={`nav-item ${!isMethodology ? 'nav-item-active' : ''}`}>
            <LayoutDashboard size={17} /><span>Analysis workspace</span>
          </Link>
          <Link data-testid="link-methodology" href="/methodology" className={`nav-item ${isMethodology ? 'nav-item-active' : ''}`}>
            <BookOpenText size={17} /><span>Methodology</span>
          </Link>
        </nav>
        <div className="mx-4 mb-5 rounded-xl border border-sidebar-border bg-sidebar-accent/55 p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold"><span className="status-dot status-dot-live" />Systems online</div>
          <p className="text-[11px] leading-5 text-sidebar-foreground/55">Screening tools are ready for your next sample.</p>
        </div>
        <div className="border-t border-sidebar-border px-7 py-4 font-mono text-[9px] uppercase tracking-[0.16em] text-sidebar-foreground/40">FS-AI / CAPSTONE BUILD</div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-border/70 bg-background/92 px-5 backdrop-blur-md sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="brand-mark brand-mark-small"><FlaskConical size={16} /></div>
            <span className="font-display text-sm font-bold">Food Safety AI</span>
          </div>
          <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground lg:flex"><span className="status-dot status-dot-live" />Demo environment / protected workspace</div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <div className="text-[11px] font-semibold">Field analyst</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">student lab team</div>
            </div>
            <div className="avatar-initials" aria-label="Field analyst profile">FA</div>
          </div>
        </header>
        <nav className="flex border-b border-border/70 bg-card px-5 py-2 lg:hidden">
          <Link data-testid="link-mobile-workspace" href="/" className={`mobile-nav-link ${!isMethodology ? 'mobile-nav-link-active' : ''}`}><LayoutDashboard size={14} />Workspace</Link>
          <Link data-testid="link-mobile-methodology" href="/methodology" className={`mobile-nav-link ${isMethodology ? 'mobile-nav-link-active' : ''}`}><BookOpenText size={14} />Methodology</Link>
        </nav>
        <main>{children}</main>
        <footer className="flex flex-col gap-2 border-t border-border/70 px-5 py-7 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-12">
          <span>Food Safety AI is a screening aid, not a laboratory confirmation.</span>
          <Link data-testid="link-footer-methodology" href="/methodology" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Read the method <ArrowUpRight size={12} /></Link>
        </footer>
      </div>
    </div>
  );
}