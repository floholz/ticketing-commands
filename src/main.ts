import * as core from '@actions/core'
import * as github from '@actions/github'
import { getOctokit, tokenizeCommand, handleCommand } from './utils'
import { parseConfig } from './config'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const { context } = github
    const payload = context.payload.issue || context.payload.pull_request
    const commentBody = context.payload.comment?.body as string

    if (
      !payload ||
      !(
        context.eventName === 'issue_comment' &&
        context.payload.action === 'created'
      )
    ) {
      core.warning('This action is only supposed on comment created.')
      return
    }

    // Check if the first line of the comment is a slash command
    const firstLine = commentBody.split(/\r?\n/)[0].trim()
    if (firstLine.length < 2 || !firstLine.startsWith('/')) {
      core.debug('The first line of the comment is not a valid slash command.')
      return
    }

    const octokit = getOctokit()
    const configPath = core.getInput('config_file')
    const config = await parseConfig(octokit, configPath)
    if (configPath) {
      core.debug(
        `Load config from "${configPath}": \n${JSON.stringify(config, null, 2)}`
      )
    }

    const { command, args } = tokenizeCommand(firstLine.slice(1))
    core.debug(`Command Name: ${command}`)
    core.debug(`Command Args: ${args}`)

    if (context.payload.issue) {
      core.debug(`Command for Issue`)
    } else {
      core.debug(`Command for Pull-Request`)
    }

    // const params = { ...context.repo, issue_number: payload.number }

    const errorHandlingCmd = handleCommand(config, command, args)
    if (errorHandlingCmd) {
      core.setFailed(`Error: handling command: ${command}`)
      return
    }

    core.setOutput('command', command)
    core.setOutput('args', args.join(' '))
  } catch (error) {
    if (error instanceof Error) {
      core.error(error)
      core.setFailed(error.message)
    }
  }
}
