import sortBy from 'lodash/fp/sortBy';
import path from 'path';
import type { GluegunCommand, GluegunToolbox } from 'gluegun';
import type { TweetEntry } from './scrape';

export function parseText(tweet: TweetEntry) {
  const urlParts =
    tweet.entities?.urls?.map(({ start, end, expanded_url, display_url }) => {
      return {
        start,
        end,
        text: `<a href="${expanded_url}">${display_url}</a>`,
      };
    }) ?? [];

  const hashtagParts =
    tweet.entities?.hashtags?.map(({ start, end, tag }) => {
      const displayText = tweet.text.substring(start, end);
      return {
        start,
        end,
        text: `<a href="https://twitter.com/hashtag/${tag}">${displayText}</a>`,
      };
    }) ?? [];

  const mentionParts =
    tweet.entities?.mentions?.map(({ start, end, username }) => {
      const displayText = tweet.text.substring(start, end);
      return {
        start,
        end,
        text: `<a href="https://twitter.com/${username}">${displayText}</a>`,
      };
    }) ?? [];

  const sortedParts = sortBy('start', [
    ...urlParts,
    ...hashtagParts,
    ...mentionParts,
  ]);

  const parsedText = sortedParts.reduce((text, part, index) => {
    const start = index === 0 ? 0 : sortedParts[index - 1].end;
    const end = part.start;
    const endText =
      index === sortedParts.length - 1 ? tweet.text.substring(part.end) : '';

    return text + tweet.text.substring(start, end) + part.text + endText;
  }, '');

  tweet.text = `<p>${parsedText.replace(/\n\n/g, '</p><p>')}</p>`.replace(
    /\n/g,
    '<br>'
  );
}

const command: GluegunCommand = {
  name: 'generate',
  alias: ['g'],
  // run is improperly typed
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  run: async (toolbox: GluegunToolbox) => {
    const {
      parameters,
      filesystem,
      template: { generate },
      print,
    } = toolbox;

    const filepath = parameters.first || '';
    const lang =
      (parameters.options['lang'] as string) ||
      (parameters.options['l'] as string) ||
      'en';

    const tweetName = path.basename(filepath, '.json');

    const threadJson = filesystem.read(filepath);
    if (!threadJson) {
      print.error(`Did not find JSON file at ${filepath}.`);
      return;
    }

    // TODO: type guard with error if it's malformed
    const thread = JSON.parse(threadJson) as TweetEntry[];

    const spinner = print.spin('Generating view');

    try {
      thread.forEach(parseText);

      await generate({
        template: 'scroll.ejs',
        target: `${tweetName}/index.html`,
        props: { thread, lang },
      });

      spinner.succeed(`Generated file at ${tweetName}/index.html`);
    } catch (error) {
      spinner.fail('Something went wrong.');
      throw error;
    }
  },
};

export default command;
