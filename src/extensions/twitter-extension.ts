import { type GluegunToolbox, print } from 'gluegun';

interface TweetReference {
  type: string;
  id: string;
}

export interface Media {
  media_key: string;
  type: 'animated_gif' | 'photo' | 'video';
  url: string;
}

interface BaseTweet {
  data: {
    id: string;
    text: string;
    attachments?: {
      media_keys: string[];
    };
    referenced_tweets?: TweetReference[];
  };
}

interface Tweet extends BaseTweet {
  includes?: {
    media?: Media[];
    tweets?: BaseTweet[];
  };
}

interface Error {
  errors: Array<{ code?: string; message: string }>;
}

type Token = string | undefined;
type HasApiToken = () => Promise<boolean>;
type SaveApiToken = (token: string) => Promise<void>;
type GetTweet = (id: string) => Promise<Tweet | Error | undefined>;
type IsTwitterError = (response: Tweet | Error) => response is Error;

export interface Twitter {
  hasApiToken: HasApiToken;
  saveApiToken: SaveApiToken;
  getTweet: GetTweet;
  isTwitterError: IsTwitterError;
}

const extension = (toolbox: GluegunToolbox): void => {
  const { http, filesystem } = toolbox;

  // --- TOKEN
  const TWITTER_CONFIG = `${filesystem.homedir()}/.threadbare`;

  let token: Token;

  const readApiToken = async (): Promise<Token> =>
    (filesystem.exists(TWITTER_CONFIG) &&
      filesystem.readAsync(TWITTER_CONFIG)) ||
    undefined;

  const getApiToken = async (): Promise<Token> => {
    if (token) return token;
    token = await readApiToken();
    return token;
  };

  const hasApiToken: HasApiToken = async () => Boolean(await getApiToken());

  const saveApiToken: SaveApiToken = (token) =>
    filesystem.writeAsync(TWITTER_CONFIG, token);

  // --- API
  const api = http.create({
    baseURL: 'https://api.twitter.com/2/tweets',
  });

  const getTweet: GetTweet = async (id) => {
    const token = await getApiToken();

    if (token) {
      api.setHeader('Authorization', `Bearer ${token}`);
      const { data } = await api.get<Tweet | Error>(`/${id}`, {
        expansions: 'attachments.media_keys,referenced_tweets.id',
        'media.fields': 'url',
      });

      return data;
    }

    print.error('No API token found.');
  };

  const isTwitterError = (response: Tweet | Error): response is Error =>
    (response as Error).errors !== undefined;

  toolbox.twitter = {
    hasApiToken,
    saveApiToken,
    getTweet,
    isTwitterError,
  };
};

export default extension;
