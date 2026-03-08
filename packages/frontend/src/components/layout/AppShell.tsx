import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { useIsMobile, useIsDesktop } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/cn';

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {!isMobile && <Sidebar collapsed={!isDesktop} />}

      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            'px-4 py-4 md:px-6 md:py-6 xl:px-8 xl:py-8',
            isMobile && 'pb-20',
          )}
        >
          <div className="max-w-6xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {isMobile && <BottomNav />}
    </div>
  );
}
