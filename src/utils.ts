import * as core from '@actions/core'
import * as github from '@actions/github'
import { Repositories } from './config'

export function getOctokit(): ReturnType<typeof github.getOctokit> {
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

// https://regex101.com/r/L76z0B/1
const TASKS_REGEX = /(?<header>###\sTasks)(?:\n-\s\[[\sx]][^\n]*)*/gm
// https://regex101.com/r/3g73WC/1
const TASKS_EXTENDED_REGEX =
  /(?<header>###\sTasks)?\n-\s\[(?:\s|(?<done>x))]\s(?<task>[^\n]*)/gm
export type IssueTask = {
  name: string
  done: boolean
}
export function parseIssueBodyForTasks(body: string): number {
  const match = TASKS_REGEX.exec(body)
  if (!match || !match.groups?.header) {
    return -1
  }
  return match.index + match[0].length
}
export function parseRepoName(searchTag: string, repos: Repositories): string {
  for (const repoName in repos) {
    for (const repoTag of repos[repoName]) {
      if (searchTag === repoTag) {
        return repoName
      }
    }
  }
  return ''
}

export function subTaskIssueBody(description?: string): string {
  let body = `### Description\n`
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
    body += `### Tasks:`
    bodyTaskIdx = body.length
  }
  body = `${body.slice(0, bodyTaskIdx)}\n- [ ] ${subTask}${body.slice(bodyTaskIdx)}`
  if (!body.endsWith('\n')) {
    body += `\n`
  }
  return body
}
