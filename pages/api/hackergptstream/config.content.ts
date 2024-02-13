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
    default: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo',
    hackerGPT: process.env.HACKERGPT_OPENROUTER_MODEL,
  },
  usePinecone: process.env.USE_PINECONE === 'TRUE',
};

export default llmConfig;
