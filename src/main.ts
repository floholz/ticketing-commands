import * as core from '@actions/core'
import { TicketingAction } from './ticketing'
import { Context } from '@actions/github/lib/context'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(context?: Context): Promise<void> {
  try {
    core.debug(`[1] setup action context`)
    const payload = context?.payload.issue || context?.payload.pull_request
    const commentBody = context?.payload.comment?.body as string

    core.debug(`[2] check event trigger`)
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
    core.debug(`[3] check command activation`)
    const firstLine = commentBody.split(/\r?\n/)[0].trim()
    if (firstLine.length < 2 || !firstLine.startsWith('/')) {
      core.debug(
        'The first line of the comment is not a valid slash command and will therefore be dismissed by this action.'
      )
      return
    }

    core.debug(`[4] setup action logic`)
    const action = new TicketingAction(context)
    core.debug(`[5] setup action config`)
    const configPath = core.getInput('config_file')
    await action.loadConfig(configPath)
    core.debug(`[6] run action logic`)
    await action.runCommand(firstLine)
    core.debug(`[7] all done`)
  } catch (error) {
    if (error instanceof Error) {
      core.error(error)
      core.setFailed(error.message)
    }
  }
}
