
-- Drop existing RESTRICTIVE policies and recreate as PERMISSIVE

-- profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

-- slot_memory table
DROP POLICY IF EXISTS "Users can create their own slot memory" ON public.slot_memory;
DROP POLICY IF EXISTS "Users can delete their own slot memory" ON public.slot_memory;
DROP POLICY IF EXISTS "Users can update their own slot memory" ON public.slot_memory;
DROP POLICY IF EXISTS "Users can view their own slot memory" ON public.slot_memory;

CREATE POLICY "Users can create their own slot memory" ON public.slot_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own slot memory" ON public.slot_memory FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own slot memory" ON public.slot_memory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own slot memory" ON public.slot_memory FOR SELECT USING (auth.uid() = user_id);

-- event_memory table
DROP POLICY IF EXISTS "Users can create their own event memory" ON public.event_memory;
DROP POLICY IF EXISTS "Users can delete their own event memory" ON public.event_memory;
DROP POLICY IF EXISTS "Users can view their own event memory" ON public.event_memory;

CREATE POLICY "Users can create their own event memory" ON public.event_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own event memory" ON public.event_memory FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own event memory" ON public.event_memory FOR SELECT USING (auth.uid() = user_id);

-- mood_entries table
DROP POLICY IF EXISTS "Users can create their own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Users can delete their own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Users can update their own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Users can view their own mood entries" ON public.mood_entries;

CREATE POLICY "Users can create their own mood entries" ON public.mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mood entries" ON public.mood_entries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own mood entries" ON public.mood_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own mood entries" ON public.mood_entries FOR SELECT USING (auth.uid() = user_id);

-- chat_messages table
DROP POLICY IF EXISTS "Users can create their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;

CREATE POLICY "Users can create their own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);

-- period_logs table
DROP POLICY IF EXISTS "Users can create their own logs" ON public.period_logs;
DROP POLICY IF EXISTS "Users can delete their own logs" ON public.period_logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON public.period_logs;
DROP POLICY IF EXISTS "Users can view their own logs" ON public.period_logs;

CREATE POLICY "Users can create their own logs" ON public.period_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own logs" ON public.period_logs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own logs" ON public.period_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own logs" ON public.period_logs FOR SELECT USING (auth.uid() = user_id);

-- conversations table
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;

CREATE POLICY "Users can create their own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations" ON public.conversations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
