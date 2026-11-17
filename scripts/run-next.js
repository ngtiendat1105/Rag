const { spawn } = require('node:child_process')

const command = process.argv[2]
const args = process.argv.slice(3)

const distDirs = {
  dev: '.next-dev',
  build: '.next-build',
  start: '.next-build',
}

if (!command || !distDirs[command]) {
  console.error('Usage: node scripts/run-next.js <dev|build|start> [next arguments]')
  process.exit(1)
}

const nextBin = process.platform === 'win32' ? 'next.cmd' : 'next'
const child = spawn(nextBin, [command, ...args], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    NEXT_DIST_DIR: distDirs[command],
  },
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 1)
})

child.on('error', (error) => {
  console.error(`Unable to start Next.js: ${error.message}`)
  process.exit(1)
})
