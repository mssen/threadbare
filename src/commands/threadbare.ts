import { GluegunCommand } from 'gluegun';

const command: GluegunCommand = {
  name: 'threadbare',
  run: (toolbox) => {
    const { print } = toolbox;

    print.info('Welcome to your CLI');
  },
};

module.exports = command;
