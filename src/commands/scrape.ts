import type { GluegunCommand, GluegunToolbox } from 'gluegun';
import { Twitter } from '../extensions/twitter-extension';

const command: GluegunCommand = {
  name: 'scrape',
  alias: ['s'],
  description: 'Scrapes a twitter thread and saves it to a JSON file',
  run: async (toolbox: GluegunToolbox) => {
    const { parameters, print, prompt, twitter: twitterUntyped } = toolbox;
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
        'Tweet ID must be a numerical ID between 1 and 19 characters'
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

    const tweet = await twitter.getTweet(id);

    if (!tweet) {
      print.error('Unexpected error.');
      return;
    }

    if (twitter.isTwitterError(tweet)) {
      print.error(`Error occurred.\n${tweet.errors.join('\n')}`);
      return;
    }

    print.debug(JSON.stringify(tweet, null, 2));
  },
};

export default command;
