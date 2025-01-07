import * as github from '@actions/github'

export async function reposGetCollaboratorPermissionLevel(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  username: string
): Promise<string> {
  const {
    data: { permission }
  } = await octokit.rest.repos.getCollaboratorPermissionLevel({
    owner,
    repo,
    username
  })
  return permission
}

export async function issuesCreate(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  title: string,
  body: string
): Promise<string | null> {
  const { data: issue } = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body
  })
  if (!issue) {
    return null
  }
  return `${owner}/${repo}#${issue.number}`
}

export async function issuesUpdate(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  issue_number: number,
  body: string
): Promise<boolean> {
  const resp = await octokit.rest.issues.update({
    owner,
    repo,
    issue_number,
    body
  })
  return resp.status === 200
}
