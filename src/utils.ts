import * as core from '@actions/core'
import * as github from '@actions/github'

export namespace Utils {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  export function getOctokit() {
    const token = core.getInput('github_token', { required: true })
    return github.getOctokit(token)
  }

  // https://regex101.com/r/3PkLfT/1
  const TOKENIZE_REGEX =
    /\S+="[^"\\]*(?:\\.[^"\\]*)*"|"[^"\\]*(?:\\.[^"\\]*)*"|\S+/g

  export function tokenizeCommand(command: string): {
    command: string
    args: string[]
  } {
    let matches
    const output: string[] = []
    while ((matches = TOKENIZE_REGEX.exec(command))) {
      output.push(matches[0])
    }

    return {
      command: output[0],
      args: output.slice(1)
    }
  }

  type Command = 'verify' | 'task'
  export function handleCommand(
    octokit: ReturnType<typeof getOctokit>,
    command: Command | string,
    args: string[]
  ): boolean {
    switch (command) {
      case 'verify':
        return true
      case 'task':
        return true
      default:
        return false
    }
  }
}
