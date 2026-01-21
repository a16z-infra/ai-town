#!/usr/bin/env -S node

import process from 'node:process';

import { run } from '../dist/cli.mjs';

run(process.argv);
