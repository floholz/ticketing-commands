import * as ticketing from '../src/ticketing'
import * as config from '../src/config'

const parseConfigMock = jest.spyOn(config, 'parseConfig')
const ticketingActionMock = jest.spyOn(ticketing, 'TicketingAction')

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets the time output', async () => {
    parseConfigMock.mockImplementation(async (): Promise<config.Config> => {
      return new Promise(() => {
        return {
          project_url: '',
          repositories: {
            'floholz/server': ['server', 'api'],
            'floholz/client': ['client', 'web-app']
          }
        }
      })
    })
  })
})
