'use client';

import { Toaster } from 'sonner';
import TeamApp from '@/components/TeamApp';

// The team app: orders, deliveries, sales, stock and invoices for the owner's teammates (each with their own PIN).
export default function TeamPage() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <TeamApp />
    </>
  );
}
