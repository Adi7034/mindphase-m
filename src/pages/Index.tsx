import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, LogOut, Trash2, Heart, BookOpen, Plus, X, History } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { QuickActions } from '@/components/QuickActions';
import { PeriodTracker } from '@/components/PeriodTracker';
import { MoodJournal } from '@/components/MoodJournal';
import { ResourcesPage } from '@/components/ResourcesPage';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GoodbyeDialog } from '@/components/GoodbyeDialog';
import { ChatHistory } from '@/components/ChatHistory';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import logo from '@/assets/logo.ico';

type ViewMode = 'chat' | 'tracker' | 'mood' | 'resources';

const isFemale = (gender: string | null) => gender?.toLowerCase() === 'female';

// Goodbye phrases to detect (supports multiple languages)
const GOODBYE_PHRASES = [
  // English - simple thanks
  'thank you', 'thanks', 'thankyou', 'ty', 'thx',
  // English - goodbye variations
  'goodbye', 'good bye', 'bye', 'thanks for helping', 'thank you for helping',
  'thanks for your help', 'thank you for your help', 'see you', 'take care',
  'gotta go', 'have to go', 'need to go', 'leaving now', 'bye bye',
  'thank you so much', 'thanks a lot', 'i appreciate it', 'that was helpful',
  'you helped me', 'feeling better now', 'i feel better', 'got to go',
  'time to go', 'im leaving', "i'm leaving", 'talk later', 'catch you later',
  'until next time', 'good night', 'goodnight', 'sweet dreams',
  // Malayalam
  'നന്ദി', 'വിട', 'പോകുന്നു', 'സഹായിച്ചതിന് നന്ദി', 'വീണ്ടും കാണാം',
  // Hindi
  'धन्यवाद', 'अलविदा', 'शुक्रिया', 'मदद के लिए शुक्रिया', 'फिर मिलेंगे',
];

const Index = () => {
  const { t } = useTranslation();
  const { messages, isLoading, isLoadingHistory, sendMessage, editMessage, clearHistory, switchConversation, currentConversationId } = useChat();
  const { user, isLoading: authLoading, signOut, userGender } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showGoodbyeDialog, setShowGoodbyeDialog] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);

  // Detect goodbye phrases in user message
  const isGoodbyeMessage = useCallback((message: string) => {
    const lowerMessage = message.toLowerCase().trim();
    return GOODBYE_PHRASES.some(phrase => lowerMessage.includes(phrase.toLowerCase()));
  }, []);

  // Handle message sending with goodbye detection
  const handleSendMessage = useCallback(async (message: string) => {
    if (isGoodbyeMessage(message)) {
      // Show dialog first, don't send the message yet
      setPendingMessage(message);
      setShowGoodbyeDialog(true);
    } else {
      sendMessage(message);
    }
  }, [isGoodbyeMessage, sendMessage]);

  // Continue chatting after goodbye - don't send the goodbye message
  const handleContinue = useCallback(() => {
    setShowGoodbyeDialog(false);
    setPendingMessage(null);
    // Simply don't send the goodbye message - it was never sent
  }, []);

  // Get a random farewell message based on conversation tone
  const getRandomFarewellMessage = useCallback(() => {
    const farewellMessages = [
      t('goodbye.farewell1'),
      t('goodbye.farewell2'),
      t('goodbye.farewell3'),
      t('goodbye.farewell4'),
      t('goodbye.farewell5'),
      t('goodbye.farewell6'),
      t('goodbye.farewell7'),
      t('goodbye.farewell8'),
    ];
    return farewellMessages[Math.floor(Math.random() * farewellMessages.length)];
  }, [t]);

  // Exit chat after goodbye
  const handleExit = useCallback(async () => {
    setShowGoodbyeDialog(false);
    setPendingMessage(null);
    const farewellMessage = getRandomFarewellMessage();
    toast.success(farewellMessage, { duration: 5000 });
    await clearHistory();
  }, [clearHistory, getRandomFarewellMessage]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const showQuickActions = messages.length <= 1;

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('nav.seeYou'));
    navigate('/auth');
  };

  if (authLoading || isLoadingHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-background to-purple-50 flex items-center justify-center">
        <img 
          src={logo} 
          alt="MindPhase-M Logo" 
          className="w-10 h-10 rounded-full shadow-lg animate-pulse"
        />
      </div>
    );
  }

  if (viewMode === 'tracker') {
    return <PeriodTracker onBack={() => setViewMode('chat')} />;
  }

  if (viewMode === 'mood') {
    return <MoodJournal onBack={() => setViewMode('chat')} />;
  }

  if (viewMode === 'resources') {
    return <ResourcesPage onBack={() => setViewMode('chat')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-background to-purple-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border"
      >
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo and Name - Centered */}
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="MindPhase-M Logo" 
              className="w-10 h-10 rounded-full shadow-lg"
            />
            <div>
              <h1 className="font-semibold text-foreground text-lg">{t('app.name')}</h1>
              <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
            </div>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            {isFemale(userGender) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setViewMode('tracker')}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.cycleTracker')}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-muted-foreground"
              title={t('nav.clearChat')}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground"
              title={t('nav.signOut')}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Chat Area */}
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-80px)]">
        <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} onEdit={editMessage} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <img 
                  src={logo} 
                  alt="MindPhase-M" 
                  className="w-9 h-9 rounded-full"
                />
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-4"
          >
            <QuickActions onSelect={handleSendMessage} disabled={isLoading} />
          </motion.div>
        )}

        {/* Input Area */}
        <div className="sticky bottom-0 px-4 py-4 bg-gradient-to-t from-background via-background to-transparent">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      {/* Floating Menu - Bottom Left */}
      <div className="fixed bottom-6 left-6 z-50">
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="absolute bottom-16 left-0 flex flex-col gap-3"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Button
                  onClick={() => {
                    setShowChatHistory(true);
                    setIsMenuOpen(false);
                  }}
                  className="gap-2 shadow-lg bg-primary hover:bg-primary/90"
                >
                  <History className="w-4 h-4" />
                  {t('chatHistory.title')}
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Button
                  onClick={() => {
                    setViewMode('resources');
                    setIsMenuOpen(false);
                  }}
                  className="gap-2 shadow-lg bg-primary hover:bg-primary/90"
                >
                  <BookOpen className="w-4 h-4" />
                  {t('nav.resources')}
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Button
                  onClick={() => {
                    setViewMode('mood');
                    setIsMenuOpen(false);
                  }}
                  className="gap-2 shadow-lg bg-primary hover:bg-primary/90"
                >
                  <Heart className="w-4 h-4" />
                  {t('nav.moodJournal')}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <motion.div
            animate={{ rotate: isMenuOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </motion.div>
        </motion.button>
      </div>

      {/* Chat History Sidebar */}
      <ChatHistory
        open={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        onSelectConversation={switchConversation}
        currentConversationId={currentConversationId}
      />

      {/* Goodbye Confirmation Dialog */}
      <GoodbyeDialog
        open={showGoodbyeDialog}
        onContinue={handleContinue}
        onExit={handleExit}
      />
    </div>
  );
};

export default Index;
