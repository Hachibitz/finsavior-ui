import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Send, 
  ArrowLeft, 
  MoreVertical, 
  Trash2, 
  Coins, 
  HelpCircle, 
  X, 
  Sparkles,
  BrainCircuit,
  User,
  Bot,
  Loader2,
  ChevronDown,
  Mic
} from 'lucide-react';
import { aiChatService, ChatMessage } from '../services/aiChatService';
import { coinService } from '../services/coinService';
import { UserProfile } from '../types';
import { useToast } from '../contexts/ToastContext';
import { translateApiError } from '../utils/apiError';
import ReactMarkdown from 'react-markdown';
import VoiceFab from './VoiceFab';
import { SaviIcon } from './Logo';

interface ChatViewProps {
  profile: UserProfile | null;
  onBack?: () => void;
  onRefreshCoins?: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ profile, onBack, onRefreshCoins }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUsingCoins, setIsUsingCoins] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [coinsBalance, setCoinsBalance] = useState(profile?.coins || 0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const COIN_COST = 10;

  useEffect(() => {
    fetchHistory();
    if (profile) setCoinsBalance(profile.coins);
  }, [profile]);

  useEffect(() => {
    if (!isLoadingHistory) {
      scrollToBottom();
    }
  }, [messages, isTyping, isLoadingHistory]);

  const fetchHistory = async () => {
    try {
      const history = await aiChatService.getChatHistory(0, 50);
      setMessages(history);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    // Check coins if enabled
    if (isUsingCoins && coinsBalance < COIN_COST) {
      showToast(t('chat.insufficientCoins'), 'error');
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const historyStrings = messages.slice(-10).map(m => `${m.role}: ${m.content}`);
      const response = await aiChatService.chatWithSavi({
        question: trimmed,
        chatHistory: historyStrings,
        isUsingCoins
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
      
      if (isUsingCoins) {
        onRefreshCoins?.();
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMsg = translateApiError(error, t('chat.processError'));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `${errorMsg} ${t('chat.tryAgain')}`
      }]);
      showToast(errorMsg, 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm(t('chat.confirmClear'))) return;
    
    try {
      await aiChatService.clearChatHistory();
      setMessages([]);
      setShowMenu(false);
      showToast(t('chat.clearSuccess'), 'success');
    } catch (error) {
      showToast(translateApiError(error, t('chat.clearError')), 'error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 animate-fade-in relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 shrink-0 p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight leading-none">{t('chat.title')}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('chat.online')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-amber-500">
            <Coins size={14} />
            <span className="text-xs font-bold">{coinsBalance}</span>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                <button 
                  onClick={handleClearHistory}
                  className="w-full px-4 py-3 text-left text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={16} />
                  {t('chat.clearHistory')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar relative z-10"
      >
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm font-medium">{t('chat.loadingConversation')}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-6">
            <div className="w-32 h-32 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden animate-bounce shadow-2xl">
              <SaviIcon className="w-full h-full" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2">{t('chat.greeting')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t('chat.greetingDesc')}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full">
              {[t('chat.sampleQ1'), t('chat.sampleQ2'), t('chat.sampleQ3')].map(q => (
                <button 
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-xs text-slate-300 hover:bg-white/10 hover:border-white/10 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-up`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
                msg.role === 'user'
                  ? profile?.profilePicture ? 'bg-transparent' : 'bg-indigo-500 text-white'
                  : 'bg-slate-800 border border-white/10'
              }`}>
                {msg.role === 'user' ? (
                  profile?.profilePicture ? (
                    <img src={profile.profilePicture} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={20} />
                  )
                ) : (
                  <SaviIcon className="w-full h-full" />
                )}
              </div>
              <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none'
              }`}>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
              <SaviIcon className="w-full h-full" />
            </div>
            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Footer / Input */}
      <footer className="relative z-10 p-4 md:p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-md space-y-4">
        {/* FSCoins Toggle */}
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Coins size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{t('chat.useCoins')}</span>
                <button onClick={() => setShowHelp(!showHelp)} className="text-slate-500 hover:text-white transition-colors">
                  <HelpCircle size={12} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500">{t('chat.coinsCost', { cost: COIN_COST })}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsUsingCoins(!isUsingCoins)}
            className={`w-10 h-5 rounded-full transition-all relative ${isUsingCoins ? 'bg-amber-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isUsingCoins ? 'left-5.5' : 'left-0.5'}`} />
          </button>
        </div>

        {showHelp && (
          <div className="p-4 bg-slate-800 border border-white/10 rounded-2xl text-xs text-slate-300 animate-fade-in relative">
            <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white">
              <X size={14} />
            </button>
            <h5 className="font-bold text-amber-500 uppercase tracking-widest text-[10px] mb-2">{t('chat.whatAreCoins')}</h5>
            <p className="leading-relaxed whitespace-pre-line">
              {t('chat.coinsHelp')}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <VoiceFab 
            mode="CHAT" 
            onTextTranscribed={(text) => setInput(text)}
            onNavigateToPlans={() => onBack?.()}
            onRefreshCoins={onRefreshCoins}
          />
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={input}
              maxLength={2000}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('chat.inputPlaceholder')}
              className="w-full bg-slate-800 border border-white/5 text-white pl-4 pr-12 py-4 rounded-2xl focus:outline-none focus:border-primary/50 transition-all text-sm"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatView;
