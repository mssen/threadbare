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

type GetTweet = (id: string) => Promise<Tweet | Error | undefined>;

export interface Twitter {
  getTweet: GetTweet;
}

const extension = (toolbox: GluegunToolbox): void => {
  const { prompt, http } = toolbox;
  const api = http.create({
    baseURL: 'https://api.twitter.com/2/tweets',
  });

  const getTweet: GetTweet = async (id) => {
    const { key } = await prompt.ask({
      type: 'input',
      name: 'key',
      message: 'API Key>',
    });

    if (key) {
      api.setHeader('Authorization', `Bearer ${key}`);
      const { data } = await api.get<Tweet | Error>(`/${id}`, {
        expansions: 'attachments.media_keys,referenced_tweets.id',
        'media.fields': 'url',
      });

      return data;
    }

    print.error('Must input API key.');
  };

  toolbox.twitter = { getTweet };
};

export default extension;
