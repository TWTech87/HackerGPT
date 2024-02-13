import { Message } from '@/types/chat';

import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

import { cleanMessagesFromWarnings } from '@/utils/app/clean-messages';
import { isEnglish, translateToEnglish } from '@/utils/app/language-utils';
// import preparePineconeQuery from '@/utils/app/prepare-pinecone-query'
import {
  replaceWordsInLastUserMessage,
  wordReplacements,
} from '@/utils/app/ai-helper';

import llmConfig from './config.content';

class APIError extends Error {
  code: any;
  constructor(message: string | undefined, code: any) {
    super(message);
    this.name = 'APIError';
    this.code = code;
  }
}

export const HackerGPTStream = async (
  messages: Message[],
  modelTemperature: number,
  maxTokens: number,
  enableStream: boolean,
  isEnhancedSearchActive?: boolean,
) => {
  const openRouterUrl = `https://openrouter.ai/api/v1/chat/completions`;
  const openRouterHeaders = {
    Authorization: `Bearer ${process.env.SECRET_OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://www.hackergpt.co',
    'X-Title': 'HackerGPT',
    'Content-Type': 'application/json',
  };

  const pineconeTemperature = 0.7;

  const cleanedMessages = await cleanMessagesFromWarnings(messages);

  const queryPineconeVectorStore = async (question: string) => {
    const embeddingsInstance = new OpenAIEmbeddings({
      openAIApiKey: process.env.SECRET_OPENAI_API_KEY,
    });

    const queryEmbedding = await embeddingsInstance.embedQuery(question);

    const PINECONE_QUERY_URL = `https://${process.env.SECRET_PINECONE_INDEX}-${process.env.SECRET_PINECONE_PROJECT_ID}.svc.${process.env.SECRET_PINECONE_ENVIRONMENT}.pinecone.io/query`;

    const requestBody = {
      topK: 4,
      vector: queryEmbedding,
      includeMetadata: true,
      namespace: `${process.env.SECRET_PINECONE_NAMESPACE}`,
    };

    try {
      const response = await fetch(PINECONE_QUERY_URL, {
        method: 'POST',
        headers: {
          'Api-Key': `${process.env.SECRET_PINECONE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let matches = data.matches || [];

      if (matches.length < 1) {
        return 'None';
      }

      matches = matches.filter(
        (match: { score: number; metadata: { text: string | any[] } }) =>
          match.score > 0.82 &&
          match.metadata.text.length >= 250 &&
          match.metadata.text.length <= 5000,
      );

      // Deduplicate matches based on their text content
      const uniqueMatches = matches.reduce(
        (acc: any[], current: { metadata: { text: string } }) => {
          const textExists = acc.find(
            (item) => item.metadata.text === current.metadata.text,
          );
          if (!textExists) {
            acc.push(current);
          }
          return acc;
        },
        [],
      );

      let formattedResults = uniqueMatches
        .map(
          (match: { metadata: { text: any } }, index: any) =>
            `[CONTEXT ${index}]:\n${match.metadata.text}\n[END CONTEXT ${index}]\n\n`,
        )
        .join('');

      // Ensure formattedResults does not exceed 7500 characters
      while (formattedResults.length > 7500) {
        let lastContextIndex = formattedResults.lastIndexOf('[CONTEXT ');
        if (lastContextIndex === -1) {
          break;
        }
        formattedResults = formattedResults
          .substring(0, lastContextIndex)
          .trim();
      }

      return formattedResults.length > 0 ? formattedResults : 'None';
    } catch (error) {
      console.error(`Error querying Pinecone: ${error}`);
      return 'None';
    }
  };

  let systemMessage: Message = {
    role: 'system',
    content: `${llmConfig.systemPrompts.hackerGPT}`,
  };

  if (
    isEnhancedSearchActive &&
    llmConfig.usePinecone &&
    cleanedMessages.length > 0 &&
    cleanedMessages[cleanedMessages.length - 1].role === 'user' &&
    cleanedMessages[cleanedMessages.length - 1].content.length >
      llmConfig.pinecone.messageLength.min
  ) {
    let latestUserMessage = cleanedMessages[cleanedMessages.length - 1].content;

    if (!(await isEnglish(latestUserMessage))) {
      latestUserMessage = await translateToEnglish(
        latestUserMessage,
        openRouterUrl,
        openRouterHeaders,
        llmConfig.models.translation,
      );
    }

    const pineconeResults = await queryPineconeVectorStore(
      latestUserMessage.trim(),
    );

    if (pineconeResults !== 'None') {
      modelTemperature = pineconeTemperature;

      systemMessage.content =
        `${llmConfig.systemPrompts.hackerGPT} ` +
        `${llmConfig.systemPrompts.pinecone} ` +
        `RAG Context:\n ${pineconeResults}`;
    }
  }

  if (cleanedMessages[0]?.role !== 'system') {
    cleanedMessages.unshift(systemMessage);
  }

  replaceWordsInLastUserMessage(messages, wordReplacements);

  const model1 = llmConfig.models.default;
  const model2 = llmConfig.models.hackerGPT;
  const selectedModel = Math.random() < 0.8 ? model1 : model2;
  console.log(cleanedMessages);
  const requestBody = {
    model: selectedModel,
    route: 'fallback',
    messages: cleanedMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    temperature: modelTemperature,
    max_tokens: maxTokens,
    stream: enableStream,
  };

  try {
    const res = await fetch(openRouterUrl, {
      method: 'POST',
      headers: openRouterHeaders,
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const result = await res.json();
      let errorMessage = result.error?.message || 'An unknown error occurred';

      switch (res.status) {
        case 400:
          throw new APIError(`Bad Request: ${errorMessage}`, 400);
        case 401:
          throw new APIError(`Invalid Credentials: ${errorMessage}`, 401);
        case 402:
          throw new APIError(`Out of Credits: ${errorMessage}`, 402);
        case 403:
          throw new APIError(`Moderation Required: ${errorMessage}`, 403);
        case 408:
          throw new APIError(`Request Timeout: ${errorMessage}`, 408);
        case 429:
          throw new APIError(`Rate Limited: ${errorMessage}`, 429);
        case 502:
          throw new APIError(`Service Unavailable: ${errorMessage}`, 502);
        default:
          throw new APIError(`HTTP Error: ${errorMessage}`, res.status);
      }
    }

    if (!res.body) {
      throw new Error('Response body is null');
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const parser = createParser(
          (event: ParsedEvent | ReconnectInterval) => {
            if ('data' in event) {
              const data = event.data;
              if (data !== '[DONE]') {
                try {
                  const json = JSON.parse(data);
                  if (json.choices && json.choices[0].finish_reason != null) {
                    controller.close();
                    return;
                  }
                  const text = json.choices[0].delta.content;
                  const queue = encoder.encode(text);
                  controller.enqueue(queue);
                } catch (e) {
                  controller.error(`Failed to parse event data: ${e}`);
                }
              }
            }
          },
        );

        for await (const chunk of res.body as any) {
          const content = decoder.decode(chunk);
          parser.feed(content);
          if (content.trim().endsWith('data: [DONE]')) {
            controller.close();
          }
        }
      },
    });

    return stream;
  } catch (error) {
    if (error instanceof APIError) {
      console.error(
        `API Error - Code: ${error.code}, Message: ${error.message}`,
      );
    } else if (error instanceof Error) {
      console.error(`Unexpected Error: ${error.message}`);
    } else {
      console.error(`An unknown error occurred: ${error}`);
    }
  }
};
