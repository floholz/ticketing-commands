import * as github from '@actions/github'
import yaml from 'js-yaml'

type Repository = {
  [repo: string]: string[]
}

type Definition = {
  project_url: string
  repositories: Repository[]
}

export async function parseConfig(
  octokit: ReturnType<typeof github.getOctokit>,
  path?: string
): Promise<Definition> {
  if (path) {
    const response = await octokit.rest.repos.getContent({
      ...github.context.repo,
      path
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = Buffer.from(response.data as any, 'base64').toString()

    if (content) {
      const config = yaml.load(content)
      if (typeof config !== 'object') {
        throw new Error('Error reading config!')
      }
      return config as Definition
    }
  }

  throw new Error('Error reading config!')
}
