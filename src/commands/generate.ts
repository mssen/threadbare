import sortBy from 'lodash/fp/sortBy';
import path from 'path';
import type { GluegunCommand, GluegunToolbox } from 'gluegun';
import type { ParsedThread, Validate } from '../extensions/validate-extension';
import type { Media } from '../extensions/media-extension';

function parseText(tweet: ParsedThread[number]) {
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

async function saveMedia(
  tweet: ParsedThread[number],
  folder: string,
  downloadMedia: Media['downloadMedia']
) {
  if (!tweet.media) return;
  const results = await Promise.allSettled(
    tweet.media.map((media) => downloadMedia(media.url, folder))
  );
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      // Don't know why this is yelling, it's checked above...
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tweet.media![index].url = result.value;
    }
  });
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
      plugin,
      validate: untypedValidate,
      media: untypedMedia,
    } = toolbox;

    const validate = untypedValidate as Validate;
    const media = untypedMedia as Media;

    const filepath = parameters.first || '';
    const lang =
      (parameters.options['lang'] as string) ||
      (parameters.options['l'] as string) ||
      'en';
    const type =
      (parameters.options['type'] as string) ||
      (parameters.options['t'] as string) ||
      'pages';

    if (type !== 'pages' && type !== 'scroll') {
      print.error('Type must be either pages or scroll.');
      return;
    }

    const tweetName = path.basename(filepath, '.json');

    const threadJson = filesystem.read(filepath);
    if (!threadJson) {
      print.error(`Did not find JSON file at ${filepath}.`);
      return;
    }

    const thread = validate.validateAndParse(threadJson);
    if (!thread) {
      return;
    }

    const spinner = print.spin('Generating view');

    try {
      thread.forEach(parseText);
      await Promise.all(
        thread.map((tweet) => saveMedia(tweet, tweetName, media.downloadMedia))
      );

      if (type === 'scroll') {
        await generate({
          template: 'scroll.ejs',
          target: `${tweetName}/index.html`,
          props: { lang, thread },
        });

        spinner.succeed(`Generated file at ${tweetName}/index.html`);
      } else {
        const totalPages = thread.length;
        await Promise.all(
          thread.map(async (tweet, index) => {
            const pageNumber = index + 1;
            await generate({
              template: 'pages.ejs',
              target: `${tweetName}/${pageNumber}.html`,
              props: { lang, pageNumber, tweet, totalPages },
            });
          })
        );

        const baseDirectory = plugin?.directory;
        if (!baseDirectory) {
          throw new Error('Could not find copy over styles.');
        }

        let pathToStyles = `${baseDirectory}/templates/style.css`;

        if (!filesystem.isFile(pathToStyles)) {
          pathToStyles = `${baseDirectory}/build/templates/style.css`;
        }

        filesystem.copy(pathToStyles, `${tweetName}/style.css`, {
          overwrite: true,
        });

        spinner.succeed(`Generated files at ${tweetName}/`);
      }
    } catch (error) {
      spinner.fail('Something went wrong.');
      throw error;
    }
  },
};

export default command;
