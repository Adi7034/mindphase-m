import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hey! 💜 I'm Luna, your wellness bestie! Period stuff, stress, or just need to chat — I'm here. No judgment! How are you? ✨",
  timestamp: new Date(),
};

export function useChat() {
  const { user, isLoading: isAuthLoading, userGender } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Helper function to load messages for a conversation
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at),
        }));
        setMessages([WELCOME_MESSAGE, ...loadedMessages]);
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  }, []);

  // Load chat history when auth is ready and user exists
  useEffect(() => {
    // Wait for auth to finish loading
    if (isAuthLoading) {
      return;
    }

    // If no user after auth loaded, stop loading history
    if (!user) {
      setIsLoadingHistory(false);
      return;
    }

    // Prevent loading history multiple times
    if (historyLoaded) {
      return;
    }

    const loadHistory = async () => {
      try {
        console.log('Loading chat history for user:', user.id);

        // Always start with a fresh chat - previous chats are accessible via history
        // This ensures returning users get a clean slate while their old chats are preserved
        setCurrentConversationId(null);
        setMessages([WELCOME_MESSAGE]);
        console.log('Starting fresh chat session for returning user');
        
        setHistoryLoaded(true);
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [user, isAuthLoading, historyLoaded]);

  const switchConversation = useCallback(async (conversationId: string | null) => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    
    if (conversationId === null) {
      // Start a new conversation
      setCurrentConversationId(null);
      setMessages([WELCOME_MESSAGE]);
    } else {
      setCurrentConversationId(conversationId);
      await loadConversationMessages(conversationId);
    }
    
    setIsLoadingHistory(false);
  }, [user]);

  // Create or get conversation
  const ensureConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;
    
    if (currentConversationId) return currentConversationId;
    
    try {
      // Create a new conversation with title from first message
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title })
        .select()
        .single();

      if (error) throw error;
      setCurrentConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }, [user, currentConversationId]);

  // Save message to database
  const saveMessage = useCallback(async (role: 'user' | 'assistant', content: string, conversationId: string | null) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ user_id: user.id, role, content, conversation_id: conversationId })
        .select()
        .single();

      if (error) throw error;
      
      // Update conversation updated_at
      if (conversationId) {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
      
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  }, [user]);

  // Delete a specific message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return;

    // Remove from local state
    setMessages(prev => prev.filter(m => m.id !== messageId));

    // Delete from database if it's a saved message
    if (!messageId.startsWith('user-') && !messageId.startsWith('assistant-') && messageId !== 'welcome') {
      try {
        await supabase
          .from('chat_messages')
          .delete()
          .eq('id', messageId);
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  }, [user]);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Ensure we have a conversation
    const conversationId = await ensureConversation(input.trim());

    // Save user message
    const savedUserMsg = await saveMessage('user', input.trim(), conversationId);
    if (savedUserMsg) {
      userMessage.id = savedUserMsg.id;
    }

    let assistantContent = '';
    const assistantId = `assistant-${Date.now()}`;

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id === assistantId) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          { id: assistantId, role: 'assistant', content: assistantContent, timestamp: new Date() },
        ];
      });
    };

    try {
      const chatMessages = [...messages.filter(m => m.id !== 'welcome'), userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: chatMessages, userGender }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {}
        }
      }

      // Save assistant message after streaming completes
      if (assistantContent) {
        const savedAssistantMsg = await saveMessage('assistant', assistantContent, conversationId);
        if (savedAssistantMsg) {
          setMessages(prev => 
            prev.map(m => m.id === assistantId ? { ...m, id: savedAssistantMsg.id } : m)
          );
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, saveMessage]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!user || isLoading) return;

    // Find the index of the message being edited
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Get all messages after the edited one (to delete)
    const messagesToDelete = messages.slice(messageIndex + 1);
    
    // Keep only messages up to and including the edited message (with new content)
    const updatedMessages = messages.slice(0, messageIndex + 1).map(m =>
      m.id === messageId ? { ...m, content: newContent } : m
    );
    
    setMessages(updatedMessages);

    // Delete messages after the edited one from database
    const idsToDelete = messagesToDelete
      .filter(m => !m.id.startsWith('user-') && !m.id.startsWith('assistant-') && m.id !== 'welcome')
      .map(m => m.id);

    if (idsToDelete.length > 0) {
      try {
        const { error } = await supabase
          .from('chat_messages')
          .delete()
          .in('id', idsToDelete);

        if (error) console.error('Error deleting messages:', error);
      } catch (error) {
        console.error('Error deleting messages:', error);
      }
    }

    // Update the edited message in database
    if (!messageId.startsWith('user-') && !messageId.startsWith('assistant-') && messageId !== 'welcome') {
      try {
        const { error } = await supabase
          .from('chat_messages')
          .update({ content: newContent })
          .eq('id', messageId);

        if (error) console.error('Error updating message:', error);
      } catch (error) {
        console.error('Error updating message:', error);
      }
    }

    // Now send the edited message to get a fresh AI response
    setIsLoading(true);

    let assistantContent = '';
    const assistantId = `assistant-${Date.now()}`;

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id === assistantId) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          { id: assistantId, role: 'assistant' as const, content: assistantContent, timestamp: new Date() },
        ];
      });
    };

    try {
      // Build messages for AI (exclude welcome message)
      const chatMessages = updatedMessages.filter(m => m.id !== 'welcome').map(m => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: chatMessages, userGender }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {}
        }
      }

      // Save assistant message after streaming completes
      if (assistantContent) {
        const savedAssistantMsg = await saveMessage('assistant', assistantContent, currentConversationId);
        if (savedAssistantMsg) {
          setMessages(prev => 
            prev.map(m => m.id === assistantId ? { ...m, id: savedAssistantMsg.id } : m)
          );
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [user, messages, isLoading, saveMessage]);

  const clearHistory = useCallback(async () => {
    if (!user) return;

    try {
      // Delete current conversation if exists
      if (currentConversationId) {
        await supabase
          .from('conversations')
          .delete()
          .eq('id', currentConversationId);
      } else {
        // Delete orphan messages
        await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', user.id)
          .is('conversation_id', null);
      }
      
      setCurrentConversationId(null);
      setMessages([WELCOME_MESSAGE]);
      toast.success('Chat history cleared 💜');
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Could not clear history');
    }
  }, [user, currentConversationId]);

  return { 
    messages, 
    isLoading, 
    isLoadingHistory, 
    sendMessage, 
    editMessage, 
    clearHistory, 
    deleteMessage,
    switchConversation,
    currentConversationId
  };
}
