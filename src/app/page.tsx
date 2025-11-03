import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to picks page - proxy.ts will handle auth redirect to login if needed
  redirect('/picks');
}
