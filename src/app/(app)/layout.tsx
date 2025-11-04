import BottomNavBar from '@/components/BottomNavBar';
import Header from '@/components/Header';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background-dark text-white">
      <Header />
      <main className="flex-1 pb-16">{children}</main>
      <BottomNavBar />
    </div>
  );
}
