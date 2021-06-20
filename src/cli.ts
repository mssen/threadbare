import { build, GluegunToolbox } from 'gluegun';

/**
 * Create the cli and kick it off
 */
async function run(argv: string[]): Promise<GluegunToolbox> {
  const cli = build()
    .brand('threadbare')
    .src(__dirname)
    .help()
    .version()
    .exclude([
      'meta',
      'strings',
      'semver',
      'system',
      'patching',
      'package-manager',
    ])
    .create();

  const toolbox = await cli.run(argv);

  // send it back (for testing, mostly)
  return toolbox;
}

export { run };
