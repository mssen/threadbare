import type { GluegunToolbox } from 'gluegun';

// add your CLI-specific functionality here, which will then be accessible
// to your commands
const extension = (toolbox: GluegunToolbox): void => {
  toolbox.foo = () => {
    toolbox.print.info('called foo extension');
  };

  // enable this if you want to read configuration in from
  // the current folder's package.json (in a "threadbare" property),
  // threadbare.config.json, etc.
  // toolbox.config = {
  //   ...toolbox.config,
  //   ...toolbox.config.loadConfig("threadbare", process.cwd())
  // }
};

export default extension;
