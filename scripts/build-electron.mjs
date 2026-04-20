import { mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const cacheRoot = join(root, '.cache')
const env = {
  ...process.env,
  npm_config_cache: join(cacheRoot, 'npm'),
  npm_config_devdir: join(cacheRoot, 'electron-gyp'),
  HOME: join(cacheRoot, 'home')
}

mkdirSync(env.npm_config_cache, { recursive: true })
mkdirSync(env.npm_config_devdir, { recursive: true })
mkdirSync(env.HOME, { recursive: true })

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const builderCommand =
  process.platform === 'win32'
    ? join(root, 'node_modules', '.bin', 'electron-builder.cmd')
    : join(root, 'node_modules', '.bin', 'electron-builder')

run(npmCommand, ['run', 'build'])
run(builderCommand, process.argv.slice(2))
