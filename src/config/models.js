export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'Google' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', provider: 'Google' },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'Google' },  
  { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', provider: 'Anthropic' },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', provider: 'Anthropic' },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI' },
  { id: 'x-ai/grok-4', name: 'Grok 4', provider: 'xAI' },
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek' },
{ id: 'z-ai/glm-4.7', name: 'GLM 4.7', provider: 'Z.AI' },
 { id: 'qwen/qwen3-vl-32b-instruct', name: 'Qwen3 VL 32B Instruct', provider: 'Qwen' },
  
];

export const DEFAULT_COUNCIL_MODELS = [
  'openai/gpt-4o-mini',
  'google/gemini-2.5-flash',
  'anthropic/claude-haiku-4.5',
  'x-ai/grok-4.1-fast',
];

export const DEFAULT_CHAIRMAN_MODEL = 'google/gemini-2.5-pro';
