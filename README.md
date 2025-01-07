# Ticketing Commands - GitHub Action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

Easily manage your projects tasks, by using `/commands` on issues.

## Usage

To include the action in a workflow in your ticketing-repository, 
you can use the `uses` syntax with the `@` symbol to reference a specific version.

By commenting `/commands` on issues, you can execute various commands on the issue. 

```yaml
steps:
   - name: Ticketing Commands
     id: ticketing_cmd
     uses: floholz/ticketing-commands@latest
     with:
        github_token: ${{ secrets.TICKETING_PAT }}
        config_file: .github/workflows/config/ticketing-cfg.yml
```

### Config
The configuration for this action is defined in a `.yaml` file in your repository. The path to the config file can be 
set with the input parameter `config_file`. The default path is `.github/workflows/config/ticketing-cmd.yml`.

_e.g.:_
```yaml
project_url: https://github.com/orgs/<orgName>/projects/<projectNumber>

repositories:
   floholz/backend-repo: ['backend', 'be']
   floholz/frontend-repo: [ 'frontend', 'client']
```

### Commands

| Command | Arguments            | Description                                                                             | Example                                  |
|--------|----------------------|-----------------------------------------------------------------------------------------|------------------------------------------|
| /task  | repo_tag, task_title | Create a new issue in the provided repository <br/> and add it as a task to this issue. | /task client Change hewader color to red |


## Example Workflow

```yaml
name: Project Ticketing Commands

on:
   issue_comment:
      types: ['created']

jobs:
   ticketing-cmd:
      name: Ticketing Cmd
      runs-on: ubuntu-latest

      steps:
         - name: Ticketing Commands
           id: ticketing_cmd
           uses: floholz/ticketing-commands@latest
           with:
              github_token: ${{ secrets.TICKETING_PAT }}
              config_file: .github/workflows/config/ticketing-cfg.yml

         - name: Print Output
           id: output
           run: |
              echo "${{ steps.ticketing_cmd.outputs.command }}"
              echo "${{ steps.ticketing_cmd.outputs.args }}"
```