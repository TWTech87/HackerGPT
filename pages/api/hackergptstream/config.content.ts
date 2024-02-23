const llmConfig = {
  pinecone: {
    temperature: 0.7,
    messageLength: {
      min: parseInt(process.env.MIN_LAST_MESSAGE_LENGTH || '50', 10),
      max: parseInt(process.env.MAX_LAST_MESSAGE_LENGTH || '1000', 10),
    },
  },
  systemPrompts: {
    hackerGPT: process.env.SECRET_HACKERGPT_SYSTEM_PROMPT,
    pinecone: process.env.PINECONE_SYSTEM_PROMPT,
  },
  models: {
    translation: process.env.OPENROUTER_TRANSLATION_MODEL,
    hackerGPT_default: process.env.OPENROUTER_HACKERGPT_DEFUALT_MODEL,
    hackerGPT_enhance: process.env.OPENROUTER_HACKERGPT_ENHANCE_MODEL,
  },
  usePinecone: process.env.USE_PINECONE === 'TRUE',
};

export default llmConfig;
