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
  if (path) {
    const response = await octokit.rest.repos.getContent({
      ...github.context.repo,
      path
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = Buffer.from(response.data as any, 'base64').toString()

    if (content) {
      const definition = yaml.load(content)
      if (typeof definition !== 'object') {
        throw new Error('Error reading config!')
      }
      return {
        octokit,
        definition
      } as Config
    }
  }

  throw new Error('Error reading config!')
}
