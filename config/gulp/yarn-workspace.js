const execa = require('execa');
const transformer = require('strong-log-transformer');
const chalk = require('chalk');

// From Lerna -- thanks!
// Lerna uses red but I'd prefer to keep that as an error indicator
const colorWheel = ['cyan', 'magenta', 'blue', 'yellow', 'green'];

let colorIndex = 0;

const nextColor = () => {
  let color = chalk[colorWheel[colorIndex]];
  colorIndex++;
  colorIndex %= colorWheel.length;
  return color;
};

async function runScript (scriptName, { cwd = process.cwd(), packageName, ...opts }) {
  let executionDir = cwd;
  const color = nextColor();
  if (packageName) {
    executionDir = `${executionDir}/packages/${packageName}`;
  }
  let tag = `${scriptName} ${packageName || '<root>'}`;
  if (tag.length > 16) {
    tag = `${tag.slice(0, 16)}\u2026`;
  }
  const spawned = execa('yarn', ['run', scriptName], {
    cwd: executionDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts
  });
  spawned.stdout.pipe(transformer({ tag: `[${color.bold(tag)}]` })).pipe(process.stdout);
  spawned.stderr.pipe(transformer({ tag: `[${chalk.red.bold(tag)}]` })).pipe(process.stderr);

  try {
    await spawned;
  } catch (error) {
    throw error;
  }
}

const scriptTask = (scriptName, packageName, opts = {}) => Object.assign(
  () => runScript(scriptName, { packageName, ...opts }),
  { displayName: `${packageName}#${scriptName}` }
);

exports.runScript = runScript;
exports.scriptTask = scriptTask;
