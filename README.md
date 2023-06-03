# chrome-unikey
chrome-unikey is an chrome extension that provide input method for Chrome OS that built on [libunikey](https://github.com/vn-input/libunikey)

[![Build Status](https://travis-ci.org/vn-input/chrome-unikey.svg?branch=master)](https://travis-ci.org/vn-input/chrome-unikey)

The extension is published at [Chrome Webstore](https://chrome.google.com/webstore/detail/unikey-ime-ti%E1%BA%BFng-vi%E1%BB%87t-bet/onehcjejplajliiggjeimjkdfegpoiko/)

Please create an [issue](https://github.com/vn-input/chrome-unikey/issues) for any question, feature request or bug

## Develop

### Get source code

```bash
git clone https://github.com/vn-input/chrome-unikey.git
cd chrome-unikey
git submodule update --init
```

### Build with docker - recommends

```bash
./docker-build.sh

# for clean up
./docker-build.sh make clean
```

### Build manual

1. Install emsdk 3.1.40 (most other version will work, but we test on this version)

2. Install nodejs 20

3. Build

    ```
    source /path/to/emsdk/emsdk_env.sh
    cd chrome-unikey
    make
    ```

### Load into chrome/chromium

Goto `chrome://extensions/` then `Load unpacked`

- `chrome-unikey/build/debug` for debug version - with console.log
- `chrome-unikey/build/release` for release version - without console.log
