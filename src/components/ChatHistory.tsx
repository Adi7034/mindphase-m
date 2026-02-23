import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { localDb } from '@/lib/localDb';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatHistoryProps {
  open: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string | null) => void;
  currentConversationId: string | null;
}

export function ChatHistory({ open, onClose, onSelectConversation, currentConversationId }: ChatHistoryProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      loadConversations();
    }
  }, [open, user]);

  const loadConversations = () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = localDb.select('conversations', { user_id: user.id } as any)
        .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setConversations(data as Conversation[]);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    onSelectConversation(null);
    onClose();
  };

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    onClose();
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localDb.delete('conversations', { id } as any);
      localDb.delete('chat_messages', { conversation_id: id } as any);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        onSelectConversation(null);
      }
      toast.success(t('chatHistory.deleted'));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error(t('chatHistory.deleteError'));
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        className="absolute left-0 top-0 h-full w-80 bg-card border-r border-border shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">{t('chatHistory.title')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4">
          <Button onClick={handleNewChat} className="w-full gap-2" variant="outline">
            <Plus className="w-4 h-4" />
            {t('chatHistory.newChat')}
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 pt-0 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('chatHistory.empty')}
              </p>
            ) : (
              <AnimatePresence>
                {conversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      currentConversationId === conversation.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conversation.updated_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
}
