import * as github from '@actions/github'
import yaml from 'js-yaml'

export type Repositories = {
  [repoName: string]: string[]
}

export type Config = {
  project_url: string
  repositories: Repositories
}

export async function parseConfig(
  octokit: ReturnType<typeof github.getOctokit>,
  path?: string
): Promise<Config> {
  if (!path) {
    throw new Error('Error reading config!')
  }

  const response = await octokit.rest.repos.getContent({
    ...github.context.repo,
    path
  })
  if (!('content' in response.data)) {
    throw new Error(`Config path '${path}' does not refer to a file.`)
  }

  const content = Buffer.from(response.data.content, 'base64').toString()
  const config = yaml.load(content)
  if (typeof config !== 'object') {
    throw new Error('Error reading config: Parsed content is not an object')
  }
  return config as Config
}
