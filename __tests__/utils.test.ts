import * as utils from '../src/utils'

const tokenizeCommandMock = jest.spyOn(utils, 'tokenizeCommand')

describe('utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    tokenizeCommandMock.mockClear()
  })

  it('correctly tokenize minimal command line', () => {
    utils.tokenizeCommand('/command')
    expect(tokenizeCommandMock).toHaveReturned()
    expect(tokenizeCommandMock.mock.results[0].value).toEqual({
      command: 'command',
      args: [],
      body: undefined
    })
  })

  it('correctly tokenize simple command line', () => {
    utils.tokenizeCommand('/command arg1 arg2')
    expect(tokenizeCommandMock).toHaveReturned()
    expect(tokenizeCommandMock.mock.results[0].value).toEqual({
      command: 'command',
      args: ['arg1', 'arg2'],
      body: undefined
    })
  })

  it('correctly tokenize complex command line', () => {
    const commandLine = `/command arg1 arg2 
Complex command lines can also include a body part.
e.g.: a description can be passed directly`
    utils.tokenizeCommand(commandLine)
    expect(tokenizeCommandMock).toHaveReturned()
    expect(tokenizeCommandMock.mock.results[0].value).toEqual({
      command: 'command',
      args: ['arg1', 'arg2'],
      body: 'Complex command lines can also include a body part.\ne.g.: a description can be passed directly'
    })
  })

  it('ignore non-command comment', () => {
    utils.tokenizeCommand('just a simple comment')
    expect(tokenizeCommandMock).toHaveReturned()
    expect(tokenizeCommandMock.mock.results[0].value).toEqual(null)
  })
})
