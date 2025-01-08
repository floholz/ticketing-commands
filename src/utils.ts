import * as core from '@actions/core'
import * as github from '@actions/github'
import { Repositories } from './config'

export function getOctokit(): ReturnType<typeof github.getOctokit> {
  const token = core.getInput('github_token', { required: true })
  return github.getOctokit(token)
}

export function tokenizeCommand(commandLine: string): {
  command: string
  args: string[]
  body?: string
} | null {
  // https://regex101.com/r/cq1wxg/1
  const TOKENIZE_REGEX = /\/(?<command>\S+)(?<args>[^\n]*)(?:\n(?<body>.*))?/gms
  // https://regex101.com/r/PQre0d/1
  const SPLIT_ARGS_REGEX = /\S+/gm

  const tokens = TOKENIZE_REGEX.exec(commandLine)
  if (!tokens || !tokens.groups?.command) {
    return null
  }
  const parsed = {
    command: tokens.groups.command,
    args: [] as string[],
    body: tokens.groups?.body
  }

  let matches
  while ((matches = SPLIT_ARGS_REGEX.exec(tokens.groups?.args ?? ''))) {
    parsed.args.push(matches[0])
  }

  return parsed
}

// https://regex101.com/r/3g73WC/1
const TASKS_EXTENDED_REGEX =
  /(?<header>##\sTasks)?\n-\s\[(?:\s|(?<done>x))]\s(?<task>[^\n]*)/gm
export type IssueTask = {
  name: string
  done: boolean
}
export function parseIssueBodyForTasks(body: string): number {
  // https://regex101.com/r/L76z0B/1
  const TASKS_REGEX = /(?<header>##\sTasks)(?:\n-\s\[[\sx]][^\n]*)*/gm

  const match = TASKS_REGEX.exec(body)
  if (!match || !match.groups?.header) {
    return -1
  }
  return match.index + match[0].length
}
export function parseRepoString(
  searchTag: string,
  repos: Repositories
): string {
  for (const repoName in repos) {
    for (const repoTag of repos[repoName]) {
      if (searchTag === repoTag) {
        return repoName
      }
    }
  }
  return ''
}

export function splitRepoAndOwner(repoString: string): {
  owner: string
  repo: string
} {
  const splits = repoString.split('/')
  if (splits.length !== 2) {
    throw new Error(
      `Repo string '${repoString}' could not be split into 'owner' and 'repo'`
    )
  }
  return {
    owner: splits[0],
    repo: splits[1]
  }
}

export function subTaskIssueBody(description?: string): string {
  let body = `## Description\n`
  if (description) {
    body += `${description}\n`
  }
  return body
}

export function addTaskToIssueBody(subTask: string, body?: string): string {
  if (!body) {
    body = ''
  }
  let bodyTaskIdx = parseIssueBodyForTasks(body)
  if (bodyTaskIdx === -1) {
    if (body.length > 0) {
      body += `\n\n`
    }
    body += `## Tasks:`
    bodyTaskIdx = body.length
  }
  body = `${body.slice(0, bodyTaskIdx)}\n- [ ] ${subTask}${body.slice(bodyTaskIdx)}`
  if (!body.endsWith('\n')) {
    body += `\n`
  }
  return body
}
