#!/bin/bash

set -e

docker build -t chrome-unikey-builder .

if [ "$#" -eq "0" ]; then
    cmd=(make)
else
    cmd=("$@")
fi

docker run --rm -it \
    -v $PWD:/src \
    --user $UID \
    chrome-unikey-builder \
    "${cmd[@]}"
