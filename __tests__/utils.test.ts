import * as utils from '../src/utils'

const tokenizeCommandMock = jest.spyOn(utils, 'tokenizeCommand')
const addTaskToIssueBodyMock = jest.spyOn(utils, 'addTaskToIssueBody')

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

  it('add task to existing task list', () => {
    const subTask = 'Additional Task'
    const body = `
## Description
description of the ticket

## Tasks
- [ ] Task 1
- [ ] Task 2

some other info
`
    utils.addTaskToIssueBody(subTask, body)
    expect(addTaskToIssueBodyMock).toHaveReturned()
    expect(addTaskToIssueBodyMock.mock.results[0].value).toEqual(`
## Description
description of the ticket

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Additional Task

some other info
`)
  })

  it('add task to empty task list', () => {
    const subTask = 'Task 1'
    const body = `
## Description
description of the ticket
`
    utils.addTaskToIssueBody(subTask, body)
    expect(addTaskToIssueBodyMock).toHaveReturned()
    expect(addTaskToIssueBodyMock.mock.results[0].value).toEqual(`
## Description
description of the ticket

## Tasks
- [ ] Task 1
`)
  })
})
