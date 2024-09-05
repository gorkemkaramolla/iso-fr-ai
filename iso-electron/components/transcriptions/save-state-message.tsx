import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Info, AlertCircle, XCircle } from 'lucide-react';

interface SaveStateMessageProps {
  saveState: 'saved' | 'no changes made' | 'needs saving' | 'save failed';
}

const SaveStateMessage: React.FC<SaveStateMessageProps> = ({ saveState }) => {
  const getMessageContent = () => {
    switch (saveState) {
      case 'saved':
        return {
          icon: <CheckCircle size={18} />,
          message: 'Değişiklikler Kaydedildi',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
        };
      case 'no changes made':
        return {
          icon: <Info size={18} />,
          message: 'Değişiklik Yok',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
        };
      case 'needs saving':
        return {
          icon: <AlertCircle size={18} />,
          message: (
            <>
              Kaydetmek için{' '}
              <kbd className='px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg'>
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + S
              </kbd>{' '}
              tuşuna basınız
            </>
          ),
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
        };
      case 'save failed':
        return {
          icon: <XCircle size={18} />,
          message: 'Save Failed',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
        };
      default:
        return null;
    }
  };

  const content = getMessageContent();

  if (!content) return null;

  return (
    <div className='absolute bottom-4 left-4 z-50'>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`flex items-center space-x-2 ${content.bgColor} ${content.textColor} px-4 py-2 rounded-full shadow-lg`}
        >
          {content.icon}
          <span className='font-medium'>{content.message}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SaveStateMessage;
