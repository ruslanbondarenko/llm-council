import { supabase } from './supabase.js';

const OPENROUTER_API_KEY = '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';

export const api = {
  async listConversations() {
    console.log('🔍 Querying Supabase: list conversations');
    const { data, error } = await supabase
      .from('conversations')
      .select('id, created_at, title, message_count')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error (list conversations):', error);
      throw new Error(`Failed to list conversations: ${error.message}`);
    }

    console.log('✅ Supabase returned', data?.length || 0, 'conversations');
    return data || [];
  },

  async createConversation() {
    console.log('🔍 Querying Supabase: create conversation');
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        title: 'New Conversation',
        message_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error (create conversation):', error);
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    console.log('✅ Supabase created conversation:', data.id);
    return data;
  },

  async getConversation(conversationId) {
    console.log('🔍 Querying Supabase: get conversation', conversationId);
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('❌ Supabase error (get conversation):', convError);
      throw new Error(`Failed to get conversation: ${convError.message}`);
    }

    console.log('🔍 Querying Supabase: get messages for conversation', conversationId);
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('❌ Supabase error (get messages):', msgError);
      throw new Error(`Failed to get messages: ${msgError.message}`);
    }

    console.log('✅ Supabase returned', messages?.length || 0, 'messages');

    const formattedMessages = messages.map((msg) => {
      if (msg.role === 'user') {
        return {
          role: 'user',
          content: msg.content,
        };
      } else {
        return {
          role: 'assistant',
          stage1: msg.stage1_responses,
          stage2: msg.stage2_rankings,
          stage3: msg.stage3_final,
          metadata: msg.metadata,
        };
      }
    });

    return {
      ...conversation,
      messages: formattedMessages,
    };
  },

  async saveUserMessage(conversationId, content) {
    console.log('🔍 Supabase: inserting user message');
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error (save user message):', error);
      throw new Error(`Failed to save user message: ${error.message}`);
    }

    console.log('🔍 Supabase: updating message count');
    await supabase
      .from('conversations')
      .update({ message_count: supabase.raw('message_count + 1') })
      .eq('id', conversationId);

    console.log('✅ User message saved:', data.id);
    return data;
  },

  async saveAssistantMessage(conversationId, stage1, stage2, stage3, metadata) {
    console.log('🔍 Supabase: inserting assistant message');
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        stage1_responses: stage1,
        stage2_rankings: stage2,
        stage3_final: stage3,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error (save assistant message):', error);
      throw new Error(`Failed to save assistant message: ${error.message}`);
    }

    console.log('🔍 Supabase: updating message count');
    await supabase
      .from('conversations')
      .update({ message_count: supabase.raw('message_count + 1') })
      .eq('id', conversationId);

    console.log('✅ Assistant message saved:', data.id);
    return data;
  },

  async updateConversationTitle(conversationId, title) {
    console.log('🔍 Supabase: updating conversation title');
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) {
      console.error('❌ Supabase error (update title):', error);
      throw new Error(`Failed to update title: ${error.message}`);
    }

    console.log('✅ Title updated');
  },

  async sendMessageStream(conversationId, content, onEvent) {
    console.log('💾 Saving user message to DB...');
    await this.saveUserMessage(conversationId, content);

    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/council-deliberation`;
    console.log('🌐 Calling Edge Function:', edgeFunctionUrl);

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userQuery: content,
        apiKey: OPENROUTER_API_KEY,
      }),
    });

    if (!response.ok) {
      console.error('❌ Edge Function returned error:', response.status, response.statusText);
      throw new Error('Failed to send message to Edge Function');
    }

    console.log('✅ Edge Function responded, starting stream...');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let stage1Data = null;
    let stage2Data = null;
    let stage3Data = null;
    let metadata = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const eventType = line.slice(7).trim();
          const nextLineIndex = lines.indexOf(line) + 1;

          if (nextLineIndex < lines.length && lines[nextLineIndex].startsWith('data: ')) {
            const dataLine = lines[nextLineIndex].slice(6);

            try {
              const eventData = JSON.parse(dataLine);

              if (eventType === 'stage1_complete') {
                stage1Data = eventData;
                onEvent(eventType, { data: eventData });
              } else if (eventType === 'stage2_complete') {
                stage2Data = eventData.rankings;
                metadata = eventData.metadata;
                onEvent(eventType, { data: eventData.rankings, metadata: eventData.metadata });
              } else if (eventType === 'stage3_complete') {
                stage3Data = eventData.response;
                onEvent(eventType, { data: eventData.response });
              } else if (eventType === 'complete') {
                console.log('💾 Saving assistant message to DB...');
                await this.saveAssistantMessage(
                  conversationId,
                  stage1Data,
                  stage2Data,
                  stage3Data,
                  metadata
                );

                if (stage1Data && stage1Data.length > 0) {
                  const shortTitle = content.slice(0, 50).trim() + (content.length > 50 ? '...' : '');
                  console.log('📝 Updating conversation title:', shortTitle);
                  await this.updateConversationTitle(conversationId, shortTitle);
                  onEvent('title_complete', {});
                }

                onEvent(eventType, eventData);
              } else {
                onEvent(eventType, eventData);
              }
            } catch (e) {
              console.error('❌ Failed to parse SSE event:', e, dataLine);
            }
          }
        }
      }
    }
  },
};
