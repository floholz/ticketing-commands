/**
 * The entrypoint for the action.
 */
import { run } from './main'
import * as github from '@actions/github'

const { context } = github
void run(context)
