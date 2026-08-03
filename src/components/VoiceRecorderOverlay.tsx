import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { useSettings } from '../SettingsContext';

interface VoiceRecorderOverlayProps {
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

export function VoiceRecorderOverlay({ onSave, onCancel }: VoiceRecorderOverlayProps) {
  const { settings } = useSettings();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording(false);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioChunksRef.current.length > 0) {
          onSave(audioBlob);
        } else {
          onCancel();
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(settings.language === 'ar' ? 'حدث خطأ في الوصول إلى الميكروفون. يرجى التحقق من الصلاحيات.' : 'Could not access microphone. Please check permissions.');
      onCancel();
    }
  };

  const stopRecording = (save: boolean = true) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (!save) {
        audioChunksRef.current = [];
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      if (!save) onCancel();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 shadow-2xl border border-neutral-200 dark:border-neutral-800" dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
            {settings.language === 'ar' ? 'تسجيل ملاحظة صوتية' : 'Recording Voice Note'}
          </h3>
          <div className="text-4xl font-mono font-bold text-blue-500 animate-pulse">
            {formatTime(duration)}
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => stopRecording(false)}
            className="px-6 py-3 rounded-xl font-bold transition-all bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 active:scale-95"
          >
            {settings.language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button 
            onClick={() => stopRecording(true)}
            className="px-6 py-3 rounded-xl font-bold transition-all bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 flex items-center gap-2 active:scale-95"
          >
            <Square size={20} fill="currentColor" />
            {settings.language === 'ar' ? 'إيقاف وحفظ' : 'Stop & Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
