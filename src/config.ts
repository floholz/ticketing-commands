import * as github from '@actions/github'
import yaml from 'js-yaml'

export type Repositories = {
  [repoName: string]: string[]
}

type Definition = {
  project_url: string
  repositories: Repositories
}

export type Config = {
  octokit: ReturnType<typeof github.getOctokit>
  definition: Definition
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
  const definition = yaml.load(content)
  if (typeof definition !== 'object') {
    throw new Error('Error reading config: Parsed content is not an object')
  }
  return {
    octokit,
    definition
  } as Config
}
