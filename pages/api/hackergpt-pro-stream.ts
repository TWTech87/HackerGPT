import { Message } from '@/types/chat';
import { APIError } from './hackergptstream/index';

import {
  replaceWordsInLastUserMessage,
  wordReplacements,
} from '@/utils/app/ai-helper';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

import { cleanMessagesFromWarnings } from '@/utils/app/clean-messages';
import llmConfig from './hackergptstream/config.content';

export const HackerGPTProStream = async (messages: Message[]) => {
  const openRouterUrl = `https://openrouter.ai/api/v1/chat/completions`;
  const openRouterHeaders = {
    Authorization: `Bearer ${process.env.SECRET_OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://www.hackergpt.co',
    'X-Title': 'HackerGPT',
    'Content-Type': 'application/json',
  };

  const cleanedMessages = await cleanMessagesFromWarnings(messages);

  let systemMessage: Message = {
    role: 'system',
    content: `${llmConfig.systemPrompts.hackerGPT}`,
  };

  if (cleanedMessages[0]?.role !== 'system') {
    cleanedMessages.unshift(systemMessage);
  }

  replaceWordsInLastUserMessage(messages, wordReplacements);

  const requestBody = {
    model: process.env.OPENROUTER_HACKERGPT_PRO_MODEL,
    route: 'fallback',
    messages: cleanedMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    temperature: 0.4,
    max_tokens: 1000,
    stream: true,
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
