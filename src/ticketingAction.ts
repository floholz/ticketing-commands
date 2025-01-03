import { Config, parseConfig } from './config'
import * as github from '@actions/github'
import {
  addTaskToIssueBody,
  getOctokit,
  parseRepoName,
  subTaskIssueBody,
  tokenizeCommand
} from './utils'
import * as core from '@actions/core'

type Command = 'verify' | 'task'
export class TicketingAction {
  payload:
    | typeof github.context.payload.issue
    | typeof github.context.payload.pull_request
  octokit: ReturnType<typeof github.getOctokit>
  config?: Config
  constructor() {
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

    if (github.context.payload.issue) {
      this.payload = github.context.payload.issue
      core.debug(`Command for Issue`)
    } else if (github.context.payload.pull_request) {
      this.payload = github.context.payload.pull_request
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

    const repoName = parseRepoName(args[0], this.config.definition.repositories)
    if (!repoName) {
      throw new Error(`Could not parse sub-repository from args: ${args[0]}`)
    }
    let subTaskName: string
    if (args.length > 1) {
      subTaskName = args.slice(1).join(' ')
    } else {
      subTaskName = 'Task'
    }
    const subTask = await this.createIssue(repoName, subTaskName)
    if (!subTask) {
      throw new Error(
        `Could not create issue in sub-repository [${repoName}]: ${subTaskName}`
      )
    }
    core.debug(
      `Created issue for task in sub-repository [${repoName}]: ${subTaskName}`
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
    repoName: string,
    issueTitle: string
  ): Promise<string> {
    const { owner } = github.context.repo
    const { data: issue } = await this.octokit.rest.issues.create({
      owner,
      repo: repoName,
      title: issueTitle,
      body: subTaskIssueBody()
    })
    if (!issue) {
      return ''
    }
    return `${repoName}#${issue.number}`
  }

  private async updateIssueWithSubTask(subTask: string): Promise<boolean> {
    const { owner, repo, number } = github.context.issue
    const body = addTaskToIssueBody(subTask, this.payload?.body)
    const resp = await this.octokit.rest.issues.update({
      owner,
      repo,
      issue_number: number,
      body
    })
    return resp.status === 200
  }

  private async checkAuthorPermissions(): Promise<boolean> {
    const { owner, repo } = github.context.repo
    const commentAuthor = github.context.payload.comment?.user?.login
    if (!commentAuthor) {
      return false
    }
    const {
      data: { permission }
    } = await this.octokit.rest.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username: commentAuthor
    })
    return permission === 'read' || permission === 'admin'
  }
}
