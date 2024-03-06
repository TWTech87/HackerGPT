export interface OpenAIModel {
  id: string;
  name: string;
  maxLength: number;
  tokenLimit: number;
}

export enum OpenAIModelID {
  HackerGPT_3_5 = 'gpt-3.5-turbo-instruct',
  // GPT-4 = 'gpt-4',
  HackerGPT_PRO = 'gpt-4',
}

export const fallbackModelID = OpenAIModelID.HackerGPT_3_5;

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.HackerGPT_3_5]: {
    id: OpenAIModelID.HackerGPT_3_5,
    name: 'HackerGPT',
    maxLength: 12000,
    tokenLimit: 4000,
  },
  [OpenAIModelID.HackerGPT_PRO]: {
    id: OpenAIModelID.HackerGPT_PRO,
    name: 'HackerGPT Pro',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  // [OpenAIModelID.GPT-4]: {
  //   id: OpenAIModelID.GPT-4,
  //   name: 'GPT-4',
  //   maxLength: 24000,
  //   tokenLimit: 8000,
  // },
};
