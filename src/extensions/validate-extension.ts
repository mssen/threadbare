import { type GluegunToolbox } from 'gluegun';
import { z, ZodError } from 'zod';

const mediaSchema = z.object({
  type: z.enum(['animated_gif', 'photo', 'video']),
  url: z.string().url().optional(),
});

const urlSchema = z.object({
  start: z.number().nonnegative().int(),
  end: z.number().positive().int(),
  expanded_url: z.string().url(),
  display_url: z.string(),
  unwound_url: z.string().optional(),
});

const hashtagSchema = z.object({
  start: z.number().nonnegative().int(),
  end: z.number().positive().int(),
  tag: z.string(),
});

const mentionSchema = z.object({
  start: z.number().nonnegative().int(),
  end: z.number().positive().int(),
  username: z.string(),
});

const threadSchema = z.array(
  z.object({
    id: z.string(),
    text: z.string(),
    media: z.array(mediaSchema).optional(),
    entities: z
      .object({
        urls: z.array(urlSchema).optional(),
        hashtags: z.array(hashtagSchema).optional(),
        mentions: z.array(mentionSchema).optional(),
      })
      .optional(),
  })
);

export type ParsedThread = z.infer<typeof threadSchema>;

type ValidateAndParse = (json: string) => ParsedThread | undefined;

export interface Validate {
  validateAndParse: ValidateAndParse;
}

const formatErrorPath = (errorPath: Array<string | number>) =>
  errorPath
    .map((path) => (typeof path === 'number' ? `[${path}]` : path))
    .join('.');

const extension = (toolbox: GluegunToolbox): void => {
  const { print } = toolbox;

  const validateAndParse: ValidateAndParse = (json) => {
    const spinner = print.spin('Parsing JSON');

    try {
      const tweet = threadSchema.parse(JSON.parse(json));
      spinner.succeed('Parsed tweet');
      return tweet;
    } catch (error) {
      if (error instanceof ZodError) {
        spinner.fail(
          error.issues
            .map(
              (issue) => `${issue.message} at ${formatErrorPath(issue.path)}`
            )
            .join('\n')
        );
      } else {
        print.error(JSON.stringify(error, null, 2));
        spinner.fail('An error occurred. Try again.');
      }
    }
  };

  toolbox.validate = {
    validateAndParse,
  };
};

export default extension;
