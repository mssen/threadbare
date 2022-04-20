import sortBy from 'lodash/fp/sortBy';
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

  tweet.text = `<p>${parsedText.replace('\n\n', '</p><p>')}</p>`.replace(
    '\n',
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

    // TODO: more options, like specifying language
    const filename = parameters.first || '';
    // TODO: account for path
    const tweetName = filename.substring(0, filename.length - 5);

    const threadJson = filesystem.read(filename);
    if (!threadJson) {
      print.error(`Did not find JSON file at ${filename}.`);
      return;
    }

    // TODO: type guard with error if it's malformed
    const thread = JSON.parse(threadJson) as TweetEntry[];
    thread.forEach(parseText);

    await generate({
      template: 'one-page.ejs',
      target: `${tweetName}/index.html`,
      props: { thread },
    });

    print.info(`Generated file at ${tweetName}/index.html`);
  },
};

export default command;
