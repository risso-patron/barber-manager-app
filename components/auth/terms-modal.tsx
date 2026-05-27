'use client';

import { useState } from 'react';
import { X, FileText, Shield } from 'lucide-react';
import Link from 'next/link';

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function TermsModal({ isOpen, onAccept, onDecline }: TermsModalProps) {
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  if (!isOpen) return null;

  const canAccept = termsChecked && privacyChecked;

  const handleAccept = () => {
    if (canAccept) {
      // Guardar consentimiento en localStorage
      const consent = {
        terms: true,
        privacy: true,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('userConsent', JSON.stringify(consent));
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onDecline}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Bienvenido a Ornō
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Por favor, acepta nuestros términos para continuar
                </p>
              </div>
            </div>
            <button
              onClick={onDecline}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Para usar Ornō, necesitas aceptar nuestros términos de servicio y política de privacidad. 
                Lee ambos documentos antes de continuar.
              </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                />
                <label htmlFor="terms" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      Acepto los Términos de Servicio
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    He leído y acepto los{' '}
                    <Link 
                      href="/terms" 
                      target="_blank"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Términos de Servicio
                    </Link>
                    {' '}de Ornō.
                  </p>
                </label>
              </div>

              {/* Privacy Checkbox */}
              <div className="flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                />
                <label htmlFor="privacy" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      Acepto la Política de Privacidad
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Entiendo cómo se manejarán mis datos según la{' '}
                    <Link 
                      href="/privacy" 
                      target="_blank"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Política de Privacidad
                    </Link>
                    .
                  </p>
                </label>
              </div>
            </div>

            {/* Warning */}
            {!canAccept && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Debes aceptar ambos documentos para continuar usando Ornō.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onDecline}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleAccept}
              disabled={!canAccept}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                canAccept
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              Aceptar y Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
