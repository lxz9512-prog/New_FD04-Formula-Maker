import React from 'react';
import { AlertTriangle, Keyboard, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Shared original upload/recognition failure dialog; no demo-specific visual layer.
export default function CaptureFailureDialog({
  failureCopy,
  onPrimary,
  onManual,
  manualLabel,
}: {
  failureCopy: { title: string; description: string; action: string } | null;
  onPrimary: () => void;
  onManual: () => void;
  manualLabel: string;
}) {
  return (
    <AnimatePresence>
      {failureCopy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[60] flex items-center justify-center bg-black/45 px-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="capture-failure-title"
            className="w-full max-w-[300px] rounded-[20px] bg-white p-5"
            style={{
              boxShadow: '0 18px 40px rgba(34, 17, 34, 0.2)',
            }}
          >
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: 'hsl(24 67% 32% / 0.1)' }}
            >
              <AlertTriangle
                className="h-5 w-5"
                style={{ color: 'hsl(24, 67%, 32%)' }}
              />
            </div>
            <h2
              id="capture-failure-title"
              className="mb-1.5 text-[18px] font-semibold"
              style={{ color: '#221122' }}
            >
              {failureCopy.title}
            </h2>
            <p
              className="mb-5 text-[13px] leading-relaxed"
              style={{ color: 'hsl(300, 3%, 45%)' }}
            >
              {failureCopy.description}
            </p>
            <div className="space-y-2.5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={onPrimary}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white"
                style={{ background: 'hsl(24, 67%, 32%)' }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {failureCopy.action}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={onManual}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold"
                style={{
                  background: 'hsl(39, 40%, 96%)',
                  color: '#221122',
                }}
              >
                <Keyboard className="h-3.5 w-3.5" />
                {manualLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
