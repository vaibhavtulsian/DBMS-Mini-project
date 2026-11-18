import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role === 'DISTRIBUTOR') {
    redirect('/admin/dashboard');
  } else {
    redirect('/retailer/catalog');
  }
}
