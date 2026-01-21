#!/bin/bash
time node --allow-natives-syntax --trace_opt --trace_deopt --code_comments --print_code bench.js | less
