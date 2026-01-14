import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Settings, { DEFAULT_COUNCIL_MODELS, DEFAULT_CHAIRMAN_MODEL } from './components/Settings';
import { api } from './api';
import './App.css';

function loadModelConfig() {
  try {
    const saved = localStorage.getItem('llm_council_model_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load model config:', e);
  }
  return {
    councilModels: DEFAULT_COUNCIL_MODELS,
    chairmanModel: DEFAULT_CHAIRMAN_MODEL,
  };
}

function saveModelConfig(councilModels, chairmanModel) {
  try {
    localStorage.setItem('llm_council_model_config', JSON.stringify({ councilModels, chairmanModel }));
  } catch (e) {
    console.error('Failed to save model config:', e);
  }
}

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelConfig, setModelConfig] = useState(loadModelConfig);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation details when selected
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const conv = await api.getConversation(id);

      if (!conv) {
        console.error('Conversation is null');
        return;
      }

      const messages = conv.messages || [];

      const processedMessages = messages.map(msg => {
        if (msg.role === 'assistant' && !msg.loading) {
          return {
            ...msg,
            loading: {
              stage1: false,
              stage2: false,
              stage3: false,
            }
          };
        }
        return msg;
      });

      setCurrentConversation({
        ...conv,
        messages: processedMessages
      });
    } catch (error) {
      console.error('Failed to load conversation:', error);
      alert(`Failed to load conversation: ${error.message}`);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation();
      setConversations([
        { id: newConv.id, created_at: newConv.created_at, message_count: 0 },
        ...conversations,
      ]);
      setCurrentConversationId(newConv.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  const handleSaveSettings = (councilModels, chairmanModel) => {
    const newConfig = { councilModels, chairmanModel };
    setModelConfig(newConfig);
    saveModelConfig(councilModels, chairmanModel);
  };

  const handleSendMessage = async (content) => {
    if (!currentConversationId || !currentConversation) return;

    setIsLoading(true);
    try {
      // Optimistically add user message to UI
      const userMessage = { role: 'user', content };
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...(prev?.messages || []), userMessage],
      }));

      // Create a partial assistant message that will be updated progressively
      const assistantMessage = {
        role: 'assistant',
        stage1: null,
        stage2: null,
        stage3: null,
        metadata: null,
        loading: {
          stage1: false,
          stage2: false,
          stage3: false,
        },
      };

      // Add the partial assistant message
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...(prev?.messages || []), assistantMessage],
      }));

      // Send message with streaming
      await api.sendMessageStream(
        currentConversationId,
        content,
        modelConfig.councilModels,
        modelConfig.chairmanModel,
        (eventType, event) => {
        switch (eventType) {
          case 'stage1_start':
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = prev.messages.map((msg, idx) => {
                if (idx === prev.messages.length - 1 && msg.loading) {
                  return {
                    ...msg,
                    loading: { ...msg.loading, stage1: true },
                  };
                }
                return msg;
              });
              return { ...prev, messages };
            });
            break;

          case 'stage1_complete':
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = prev.messages.map((msg, idx) => {
                if (idx === prev.messages.length - 1) {
                  return {
                    ...msg,
                    stage1: event.data,
                    loading: { ...msg.loading, stage1: false },
                  };
                }
                return msg;
              });
              return { ...prev, messages };
            });
            break;

          case 'stage2_start':
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = prev.messages.map((msg, idx) => {
                if (idx === prev.messages.length - 1 && msg.loading) {
                  return {
                    ...msg,
                    loading: { ...msg.loading, stage2: true },
                  };
                }
                return msg;
              });
              return { ...prev, messages };
            });
            break;

          case 'stage2_complete':
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = prev.messages.map((msg, idx) => {
                if (idx === prev.messages.length - 1) {
                  return {
                    ...msg,
                    stage2: event.data,
                    metadata: event.metadata,
                    loading: { ...msg.loading, stage2: false },
                  };
                }
                return msg;
              });
              return { ...prev, messages };
            });
            break;

          case 'stage3_start':
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = prev.messages.map((msg, idx) => {
                if (idx === prev.messages.length - 1 && msg.loading) {
                  return {
                    ...msg,
                    loading: { ...msg.loading, stage3: true },
                  };
                }
                return msg;
              });
              return { ...prev, messages };
            });
            break;

          case 'stage3_complete':
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = prev.messages.map((msg, idx) => {
                if (idx === prev.messages.length - 1) {
                  return {
                    ...msg,
                    stage3: event.data,
                    loading: { ...msg.loading, stage3: false },
                  };
                }
                return msg;
              });
              return { ...prev, messages };
            });
            break;

          case 'title_complete':
            // Reload conversations to get updated title
            loadConversations();
            break;

          case 'complete':
            // Stream complete, reload conversations list
            loadConversations();
            setIsLoading(false);
            break;

          case 'error':
            console.error('Stream error:', event.message);
            setCurrentConversation((prev) => {
              if (!prev) return prev;
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.stage3 = {
                  model: 'Error',
                  response: event.message || 'Failed to process request. Please try again.',
                };
                lastMsg.loading = { stage1: false, stage2: false, stage3: false };
              }
              return { ...prev, messages };
            });
            setIsLoading(false);
            break;

          default:
            console.log('Unknown event type:', eventType);
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setCurrentConversation((prev) => {
        if (!prev) return prev;
        const messages = [...prev.messages];
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.stage3 = {
            model: 'Error',
            response: error.message || 'Failed to send message. Please try again.',
          };
          lastMsg.loading = { stage1: false, stage2: false, stage3: false };
        }
        return { ...prev, messages };
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <ChatInterface
        conversation={currentConversation}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        councilModels={modelConfig.councilModels}
        chairmanModel={modelConfig.chairmanModel}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

export default App;
