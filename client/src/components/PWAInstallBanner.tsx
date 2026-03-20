// ============================================================
// UniAgenda — PWA Install Banner
// Design: Fresh Academic
// ============================================================

import React, { useState } from 'react';
import { Download, X, GraduationCap } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';

export default function PWAInstallBanner() {
  const { canInstall, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-50">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Instalar UniAgenda</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Adicione à tela inicial para acesso rápido e uso offline
            </p>
          </div>
          <button
            className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            onClick={promptInstall}
            size="sm"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
          >
            <Download size={14} />
            Instalar
          </Button>
          <Button
            onClick={() => setDismissed(true)}
            size="sm"
            variant="outline"
            className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Agora não
          </Button>
        </div>
      </div>
    </div>
  );
}
