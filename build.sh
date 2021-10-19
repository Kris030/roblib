#!/bin/bash

# typescript compile
tsc

# generate browser lib
tail -n +2 out/lib.js > out/lib_browser.js
