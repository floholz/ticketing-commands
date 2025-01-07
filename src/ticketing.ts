import { Config, parseConfig } from './config'
import * as github from '@actions/github'
import {
  addTaskToIssueBody,
  getOctokit,
  parseRepoString,
  splitRepoAndOwner,
  subTaskIssueBody,
  tokenizeCommand
} from './utils'
import * as core from '@actions/core'
import { Context } from '@actions/github/lib/context'
import {
  issuesCreate,
  issuesUpdate,
  reposGetCollaboratorPermissionLevel
} from './api'

type Command = 'verify' | 'task'
export class TicketingAction {
  context: Context
  octokit: ReturnType<typeof github.getOctokit>
  config?: Config
  constructor(context: Context) {
    this.context = context
    this.octokit = getOctokit()
  }

  async loadConfig(configPath: string): Promise<void> {
    const config = await parseConfig(this.octokit, configPath)
    if (!config) {
      throw new Error(`Could not parse config: ${configPath}`)
    }
    this.config = config
    core.debug(
      `Load config from "${configPath}": \n${JSON.stringify(this.config, null, 2)}`
    )
  }

  async runCommand(commandLine: string): Promise<void> {
    const permResult = await this.checkAuthorPermissions()
    if (!permResult) {
      throw new Error(`Command author is not permitted to perform this action`)
    }

    if (this.context.payload.issue) {
      core.debug(`Command for Issue`)
    } else if (this.context.payload.pull_request) {
      core.debug(`Command for Pull-Request`)
    }

    const { command, args } = tokenizeCommand(commandLine.slice(1))
    core.debug(`Command Name: ${command}`)
    core.debug(`Command Args: ${args}`)

    await this.handleCommand(command, args)

    core.setOutput('command', command)
    core.setOutput('args', args.join(' '))
  }

  private async handleCommand(
    command: Command | string,
    args: string[]
  ): Promise<boolean> {
    switch (command) {
      case 'verify':
        await this.verifyTask()
        return true
      case 'task':
        await this.createTask(args)
        return true
      default:
        core.debug(`unknown command: ${command}`)
        return false
    }
  }

  private async createTask(args: string[]): Promise<void> {
    if (!this.config) {
      throw new Error(`Config must be loaded first`)
    }
    if (args.length === 0) {
      throw new Error(
        `No arguments provided. At least one argument, for the repository name, must be provided`
      )
    }

    const repoString = parseRepoString(args[0], this.config.repositories)
    core.debug(`parsed repo name: '${repoString}'`)
    if (!repoString) {
      throw new Error(`Could not parse sub-repository from args: ${args[0]}`)
    }
    let subTaskName: string
    if (args.length > 1) {
      subTaskName = args.slice(1).join(' ')
    } else {
      subTaskName = 'Task'
    }
    core.debug(`parsed sub task: '${subTaskName}'`)
    const subTask = await this.createIssue(repoString, subTaskName)
    if (!subTask) {
      throw new Error(
        `Could not create issue in sub-repository [${repoString}]: ${subTaskName}`
      )
    }
    core.debug(
      `Created issue for task in sub-repository [${repoString}]: ${subTaskName}`
    )
    const updated = await this.updateIssueWithSubTask(subTask)
    if (!updated) {
      throw new Error(`Failed to update issue with subtask: ${subTask}`)
    }
    core.debug(`Issue updated with sub task: ${subTask}`)
  }

  private async verifyTask(): Promise<void> {
    throw new Error(`Not implemented`)
  }

  private async createIssue(
    repoString: string,
    issueTitle: string
  ): Promise<string | null> {
    const { owner, repo } = splitRepoAndOwner(repoString)
    core.debug(`owner: ${owner}`)
    core.debug(`repo: ${repo}`)
    return issuesCreate(
      this.octokit,
      owner,
      repo,
      issueTitle,
      subTaskIssueBody()
    )
  }

  private async updateIssueWithSubTask(subTask: string): Promise<boolean> {
    const { owner, repo, number } = this.context.issue
    const body = addTaskToIssueBody(subTask, this.context.payload?.body)
    return issuesUpdate(this.octokit, owner, repo, number, body)
  }

  private async checkAuthorPermissions(): Promise<boolean> {
    const { owner, repo } = this.context.repo
    const commentAuthor = this.context.payload.comment?.user?.login
    if (!commentAuthor) {
      return false
    }
    const permission = await reposGetCollaboratorPermissionLevel(
      this.octokit,
      owner,
      repo,
      commentAuthor
    )
    return permission === 'write' || permission === 'admin'
  }
}
