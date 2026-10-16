import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, Check, AlertCircle, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import { AppSettings } from '../types';
import { testGeminiApiKey } from '../services/geminiService';
import { getActiveApiKey } from '../services/taskService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey);
  const [showKey, setShowKey] = useState(false);
  const [saveLocally, setSaveLocally] = useState(settings.saveKeyLocally);
  const [selectedModel, setSelectedModel] = useState(settings.geminiModel || 'gemini-1.5-flash');
  
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Determine if an environment variable key is currently present
  const { source: activeSource, key: activeKey } = getActiveApiKey(settings);
  const hasEnvKey = activeSource === 'env';

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(settings.geminiApiKey);
      setSaveLocally(settings.saveKeyLocally);
      setSelectedModel(settings.geminiModel || 'gemini-1.5-flash');
      setTestStatus('idle');
      setTestMessage('');
      setShowKey(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const keyToTest = apiKeyInput.trim() || activeKey;
    if (!keyToTest) {
      setTestStatus('error');
      setTestMessage('No API key entered or detected.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Pinging Gemini API endpoint...');

    const result = await testGeminiApiKey(keyToTest, selectedModel);
    if (result.success) {
      setTestStatus('success');
      setTestMessage(result.message);
    } else {
      setTestStatus('error');
      setTestMessage(result.message);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      geminiApiKey: apiKeyInput.trim(),
      geminiModel: selectedModel,
      saveKeyLocally: saveLocally,
    });
    onClose();
  };

  const handleClearKey = () => {
    setApiKeyInput('');
    setTestStatus('idle');
    setTestMessage('');
  };

  const maskKey = (raw: string) => {
    if (!raw) return '';
    if (raw.length <= 8) return '••••••••';
    return `${raw.slice(0, 4)}••••••••••••••••${raw.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-2xl bg-dark-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-dark-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="settings-title" className="text-base font-semibold text-white">
                CommitDesk Settings
              </h3>
              <p className="text-xs text-slate-400">Configure Gemini AI & Task Extraction</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Active Key Status Banner */}
          <div className="p-3.5 rounded-xl border bg-slate-800/40 border-slate-700/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-medium text-slate-200 flex items-center gap-2">
                Active Extraction Engine:
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {activeKey ? `Gemini Active (${activeSource === 'env' ? '.env variable' : 'Custom Key'})` : 'Offline Deterministic Parser'}
                </span>
              </div>
              <p className="text-slate-400">
                {activeKey
                  ? `Active key configured via ${activeSource === 'env' ? 'local development .env' : 'browser settings'}.`
                  : 'No Gemini key detected. CommitDesk is running in full offline mode using the deterministic local parser.'}
              </p>
              {hasEnvKey && activeSource === 'env' && (
                <p className="text-[11px] text-amber-300/90 font-mono mt-1">
                  Detected GEMINI_API_KEY from local .env. Entering a custom key below will override it.
                </p>
              )}
            </div>
          </div>

          {/* Gemini API Key Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="gemini-key" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-brand-400" />
                Custom Gemini API Key
              </label>
              {apiKeyInput && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline"
                >
                  Clear Key
                </button>
              )}
            </div>

            <div className="relative">
              <input
                id="gemini-key"
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={e => {
                  setApiKeyInput(e.target.value);
                  setTestStatus('idle');
                }}
                placeholder={hasEnvKey ? 'Using .env key (enter here to override)' : 'Paste Gemini API Key (starts with AIzaSy...)'}
                className="w-full px-3.5 py-2.5 pr-20 text-xs font-mono bg-dark-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Masked Preview if key exists */}
            {apiKeyInput && !showKey && (
              <p className="text-[11px] font-mono text-slate-500">
                Current masked: {maskKey(apiKeyInput)}
              </p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your API key stays strictly in your browser. It is never transmitted to any third-party server or backend.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label htmlFor="model-select" className="text-xs font-semibold text-slate-200">
              Gemini Model
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-dark-950 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended: Fast & Strict JSON)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next Gen)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
            </select>
          </div>

          {/* Persistence Choice */}
          <div className="p-3 rounded-xl border border-slate-800 bg-dark-950/60 flex items-start gap-3">
            <input
              id="save-locally"
              type="checkbox"
              checked={saveLocally}
              onChange={e => setSaveLocally(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-dark-900 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="save-locally" className="text-xs text-slate-300 cursor-pointer select-none">
              <span className="font-medium text-slate-200 block">Persist key in browser localStorage</span>
              <span className="text-slate-400 text-[11px]">
                If unchecked, the key will only be held in memory for this browser session.
              </span>
            </label>
          </div>

          {/* Test Connection Button & Message */}
          <div className="pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing' || (!apiKeyInput && !activeKey)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>{testStatus === 'testing' ? 'Testing...' : 'Test Connection'}</span>
              </button>

              {testStatus === 'success' && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>{testMessage}</span>
                </div>
              )}
              {testStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[260px]" title={testMessage}>
                    {testMessage}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-lg shadow-brand-500/25 transition-all"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
