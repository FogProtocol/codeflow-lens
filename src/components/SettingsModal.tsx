import React, { useState } from 'react';
import { X, Key, Check, AlertCircle, ExternalLink, Globe, ShieldCheck } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey } from '../services/gemini';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [isSaved, setIsSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(apiKey);
    setIsSaved(true);
    onKeySaved();
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClear = () => {
    clearStoredApiKey();
    setApiKey('');
    onKeySaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        
        {/* Header (Light Theme) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg border border-blue-200">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Engine & Netlify Setup</h2>
              <p className="text-xs text-slate-500">Configure Free Gemini API Key & Zero-Cost Hosting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          
          {/* Gemini API Key Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                Get free key at AI Studio
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all pr-24"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-200 font-medium"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved locally in browser localStorage only</span>
              </div>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-red-600 hover:text-red-700 underline font-medium"
                >
                  Clear Key
                </button>
              )}
            </div>
          </div>

          {/* Offline / Demo Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-900">Zero-Config Demo Mode Available: </span>
              Even without an API key, the built-in walkthroughs (Python connection pool, React streaming, C lock-free queue) are fully interactive across all 3 levels. Adding your free Gemini API key lets you run the explainer and ask questions on any custom code you upload or paste.
            </div>
          </div>

          {/* Netlify Free Deployment Guide */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Globe className="w-4 h-4 text-cyan-600" />
              <span>How to Host Free on Netlify (100% Free Forever)</span>
            </div>
            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed pl-1 font-sans">
              <li>Open <strong className="text-slate-800">app.netlify.com/drop</strong> in your browser.</li>
              <li>Drag and drop the <code className="text-blue-700 font-semibold">dist</code> folder from this project onto the browser page.</li>
              <li>Your site goes live instantly with a free <code className="text-blue-700">.netlify.app</code> URL and free SSL!</li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{isSaved ? 'Saved!' : 'Save Key'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
