import BottomNavBar from '@/components/BottomNavBar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background-dark text-white">
      <main className="flex-1 pb-16">{children}</main>
      <BottomNavBar />
    </div>
  );
}
