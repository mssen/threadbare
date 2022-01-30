import pick from 'lodash/fp/pick';
import type { GluegunCommand, GluegunToolbox } from 'gluegun';
import type {
  Twitter,
  Media,
  UrlEntity,
  MentionEntity,
  HashtagEntity,
} from '../extensions/twitter-extension';

interface TweetEntry {
  id: string;
  text: string;
  media?: Pick<Media, 'type' | 'url'>[];
  entities?: {
    urls?: Omit<UrlEntity, 'url'>[];
    hashtags?: HashtagEntity[];
    mentions?: MentionEntity[];
  };
}

const command: GluegunCommand = {
  name: 'scrape',
  alias: ['s'],
  description: 'Scrapes a twitter thread and saves it to a JSON file',
  run: async (toolbox: GluegunToolbox) => {
    const {
      filesystem,
      parameters,
      print,
      prompt,
      twitter: twitterUntyped,
    } = toolbox;
    const twitter = twitterUntyped as Twitter;

    let id = parameters.first;

    if (!id) {
      const result = await prompt.ask({
        type: 'input',
        name: 'id',
        message: 'Tweet ID',
      });
      id = result?.id;
    }

    if (!/^[0-9]{1,19}$/.test(id)) {
      print.error(
        'Tweet ID must be a numerical ID between 1 and 19 characters.'
      );
      return;
    }

    if (!(await twitter.hasApiToken())) {
      const result = await prompt.ask({
        type: 'input',
        name: 'token',
        // TODO: a better help message that specifies this is the bearer token
        message: 'Twitter Token',
      });

      if (result?.token) {
        await twitter.saveApiToken(result.token);
      } else {
        print.error('Must input API token.');
        return;
      }
    }

    const data: TweetEntry[] = [];

    const fetchAndParse = async (tweetId: string): Promise<void> => {
      const tweet = await twitter.getTweet(tweetId);

      if (!tweet) {
        throw new Error('Unexpected error.');
      }

      if (twitter.isTwitterError(tweet)) {
        throw new Error(`Error occurred.\n${tweet.errors.join('\n')}`);
      }

      data.unshift({
        id: tweet.data.id,
        text: tweet.data.text,
        ...(tweet.includes?.media
          ? {
              media: tweet.includes.media.map(pick(['type', 'url'])),
            }
          : {}),
        ...(tweet.data.entities
          ? {
              entities: {
                urls: tweet.data.entities.urls?.map(
                  pick(['start', 'end', 'expanded_url', 'display_url'])
                ),
                hashtags: tweet.data.entities.hashtags?.map(
                  pick(['start', 'end', 'tag'])
                ),
                mentions: tweet.data.entities.mentions?.map(
                  pick(['start', 'end', 'username'])
                ),
              },
            }
          : {}),
      });

      if (tweet.data.referenced_tweets) {
        const [repliedToTweet] = tweet.data.referenced_tweets.filter(
          (tweet) => tweet.type === 'replied_to'
        );

        if (repliedToTweet) {
          await fetchAndParse(repliedToTweet.id);
        }
      }
    };

    const spinner = print.spin('Fetching tweet thread');
    try {
      await fetchAndParse(id);
      spinner.succeed(`Saved to ${id}.json`);
    } catch (error) {
      spinner.fail((error as Error).message);
    }

    filesystem.write(`${id}.json`, data);
  },
};

export default command;
