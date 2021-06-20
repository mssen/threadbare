import { GluegunToolbox, print } from 'gluegun';

interface TweetReference {
  type: string;
  id: string;
}

interface Media {
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
type ReadApiToken = () => Promise<Token>;
type GetApiToken = () => Promise<Token>;
type HasApiToken = () => Promise<boolean>;
type SaveApiToken = (token: string) => Promise<void>;
type GetTweet = (id: string) => Promise<Tweet | Error | undefined>;

export interface Twitter {
  hasApiToken: HasApiToken;
  saveApiToken: SaveApiToken;
  getTweet: GetTweet;
}

const extension = (toolbox: GluegunToolbox): void => {
  const { http, filesystem } = toolbox;

  // --- TOKEN
  const TWITTER_CONFIG = `${filesystem.homedir()}/.threadbare`;

  let token: Token;

  const readApiToken: ReadApiToken = async () =>
    (filesystem.exists(TWITTER_CONFIG) &&
      filesystem.readAsync(TWITTER_CONFIG)) ||
    undefined;

  const getApiToken: GetApiToken = async () => {
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

  toolbox.twitter = {
    hasApiToken,
    saveApiToken,
    getTweet,
  };
};

export default extension;
