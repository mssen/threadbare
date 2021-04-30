import type { GluegunCommand, GluegunToolbox } from 'gluegun';

const command: GluegunCommand = {
  name: 'generate',
  alias: ['g'],
  run: async (toolbox: GluegunToolbox) => {
    const {
      parameters,
      template: { generate },
      print: { info },
    } = toolbox;

    const name = parameters.first || '';

    await generate({
      template: 'model.ts.ejs',
      target: `models/${name}-model.ts`,
      props: { name },
    });

    info(`Generated file at models/${name}-model.ts`);
  },
};

export default command;
