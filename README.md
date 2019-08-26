# chrome-unikey
chrome-unikey is an chrome extension that provide input method for Chrome OS that built on [libunikey](https://github.com/vn-input/libunikey)

[![Build Status](https://travis-ci.org/vn-input/chrome-unikey.svg?branch=master)](https://travis-ci.org/vn-input/chrome-unikey)

The extension is published at [Chrome Webstore](https://chrome.google.com/webstore/detail/unikey-ime-ti%E1%BA%BFng-vi%E1%BB%87t-bet/onehcjejplajliiggjeimjkdfegpoiko/)

Please create an [issue](https://github.com/vn-input/chrome-unikey/issues) for any question, feature request or bug

## Install

1. Install [emscripten sdk](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html)
2. Build

    ```
    source /path/to/emsdk/emsdk_env.sh
    cd chrome-unikey
    git submodule init --update
    make
    ```
3. Goto `chrome://extensions/` then `Load unpacked`, path `chrome-unikey/build/debug` or `chrome-unikey/build/release`
