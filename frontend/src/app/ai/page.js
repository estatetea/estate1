'use client';

import { Toaster } from 'sonner';
import AIOpsDashboard from '@/components/AIOpsDashboard';

export default function EstateTeaAIPage() {
  const navigate = (path) => {
    if (path === 'store' || path === 'home') {
      window.location.href = '/';
      return;
    }
    window.location.href = '/ai';
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <AIOpsDashboard navigate={navigate} />
    </>
  );
}
