import { Metadata } from 'next';
import AdminCommandPanel from '@/components/AdminCommandPanel';

export const metadata: Metadata = {
  title: 'Admin Command Panel - Game Management',
  description: 'Send commands to game server admin interface',
};

export default function AdminPage() {
  return <AdminCommandPanel />;
}
