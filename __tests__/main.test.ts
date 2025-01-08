/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/main'
import * as config from '../src/config'
import * as api from '../src/api'
import { TicketingAction } from '../src/ticketing'
import { Context } from '@actions/github/lib/context'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')
const parseConfigMock = jest.spyOn(config, 'parseConfig')
const permissionsMock = jest.spyOn(api, 'reposGetCollaboratorPermissionLevel')
const issueCreateMock = jest.spyOn(api, 'issuesCreate')
const issueUpdateMock = jest.spyOn(api, 'issuesUpdate')
const ticketingMock = jest.spyOn(TicketingAction.prototype, 'runCommand')

// Mock the GitHub Actions core library
let errorMock: jest.SpyInstance
let warningMock: jest.SpyInstance
let getInputMock: jest.SpyInstance
let setFailedMock: jest.SpyInstance
let setOutputMock: jest.SpyInstance

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    errorMock = jest.spyOn(core, 'error').mockImplementation()
    warningMock = jest.spyOn(core, 'warning').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()

    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'github_token':
          return 'GITHUB_TOKEN'
        case 'config_file':
          return '.github/workflows/config/project-slash-cmd.yml'
        default:
          return ''
      }
    })
  })

  it('success status', async () => {
    parseConfigMock.mockResolvedValue({
      project_url: '',
      repositories: {
        'floholz/server': ['server', 'api'],
        'floholz/client': ['client', 'web-app']
      }
    })
    permissionsMock.mockResolvedValue('admin')
    issueCreateMock.mockResolvedValue('floholz/server#0')
    issueUpdateMock.mockResolvedValue(true)

    const context: unknown = {
      payload: {
        issue: {
          number: 0,
          body: 'mock issue'
        },
        comment: {
          body: '/task api Test Implementation',
          id: 0,
          user: {
            login: 'floholz'
          }
        },
        action: 'created'
      },
      issue: {
        owner: 'floholz',
        repo: 'server',
        number: 0
      },
      eventName: 'issue_comment',
      repo: {
        owner: 'floholz',
        repo: 'server'
      }
    }
    await main.run(context as Context)
    expect(getInputMock).toHaveBeenCalled()
    expect(ticketingMock).toHaveBeenCalled()
    expect(errorMock).not.toHaveBeenCalled()
    expect(setFailedMock).not.toHaveBeenCalled()
    expect(setOutputMock).toHaveBeenCalledTimes(3)
    expect(runMock).toHaveReturned()
  })

  it('ignore non command comments', async () => {
    const context: unknown = {
      payload: {
        issue: {
          body: 'mock issue'
        },
        comment: {
          body: 'just a comment, no command'
        },
        action: 'created'
      },
      eventName: 'issue_comment'
    }
    await main.run(context as Context)
    expect(ticketingMock).not.toHaveBeenCalled()
    expect(errorMock).not.toHaveBeenCalled()
    expect(setFailedMock).not.toHaveBeenCalled()
    expect(runMock).toHaveReturned()
  })

  it('invalid permissions [read]', async () => {
    parseConfigMock.mockResolvedValue({
      project_url: '',
      repositories: {
        'floholz/server': ['server', 'api'],
        'floholz/client': ['client', 'web-app']
      }
    })
    permissionsMock.mockResolvedValue('read')

    const context: unknown = {
      payload: {
        issue: {
          number: 0,
          body: 'mock issue'
        },
        comment: {
          body: '/task api Test Implementation',
          id: 0,
          user: {
            login: 'floholz'
          }
        },
        action: 'created'
      },
      issue: {
        owner: 'floholz',
        repo: 'server',
        number: 0
      },
      eventName: 'issue_comment',
      repo: {
        owner: 'floholz',
        repo: 'server'
      }
    }
    await main.run(context as Context)
    expect(getInputMock).toHaveBeenCalled()
    expect(errorMock).toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenCalled()
    expect(runMock).toHaveReturned()
  })

  it('sets a failed status', async () => {
    await main.run()
    expect(warningMock).toHaveBeenCalled()
    expect(runMock).toHaveReturned()
  })
})
