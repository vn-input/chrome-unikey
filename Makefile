EMCC ?= emcc

SOURCE_DIR = $(shell pwd)
BUILD_DIR = $(SOURCE_DIR)/build

LIBUNIKEY_LIB = $(BUILD_DIR)/libunikey/src/libunikey.a
LIBUNIKEY_INC = -I $(SOURCE_DIR)/libunikey/src

BASE_EMCC = $(EMCC) $(SOURCE_DIR)/src/embind.cpp --bind $(LIBUNIKEY_LIB) $(LIBUNIKEY_INC) \
	-s ENVIRONMENT=web \
	-s MODULARIZE=1 \
	-s EXPORT_NAME=LibUnikeyFactory \
	-s DYNAMIC_EXECUTION=0 \
	-s WASM=1

.PHONY: all release debug clean libunikey test

all: debug release

debug: libunikey npm-install
	@$(RM) -r $(BUILD_DIR)/$@
	@cp -r $(SOURCE_DIR)/src/template $(BUILD_DIR)/$@

	@sed -i.bak -E "s/__VERSION__/`node -p "require('./package.json').version"`.`date +%M%S`/" $(BUILD_DIR)/$@/manifest.json
	@sed -i.bak -E 's/__MSG_appName__/\0 DEBUG/ ; s/Vietnamese[^"]*/\0 DEBUG/' $(BUILD_DIR)/$@/manifest.json
	@rm -f $(BUILD_DIR)/$@/manifest.json.bak

	@npx webpack --config webpack.debug.js --output-path $(BUILD_DIR)/$@/
	@$(BASE_EMCC) -o $(BUILD_DIR)/$@/unikey.js -O0

release: libunikey npm-install
	@$(RM) -r $(BUILD_DIR)/$@
	@cp -r $(SOURCE_DIR)/src/template $(BUILD_DIR)/$@

	@sed -i.bak -E "s/__VERSION__/`node -p "require('./package.json').version"`/" $(BUILD_DIR)/$@/manifest.json
	@rm -f $(BUILD_DIR)/$@/manifest.json.bak

	@npx webpack --config webpack.release.js --output-path $(BUILD_DIR)/$@/
	@$(BASE_EMCC) -o $(BUILD_DIR)/$@/unikey.js -O3
	@$(RM) $(BUILD_DIR)/$@.zip && (cd $(BUILD_DIR)/$@ && zip -r ../$@.zip *)

libunikey:
	@mkdir -p $(BUILD_DIR)/libunikey
	@(cd $(BUILD_DIR)/libunikey && CC="$(EMCC)" CXX="$(EMCC)" cmake $(SOURCE_DIR)/libunikey && make)

npm-install:
	@npm install

clean:
	@$(RM) -rf node_modules $(BUILD_DIR)

test:
	@$(BASE_EMCC) -o $(BUILD_DIR)/libunikey-test.js -O0 -s "ENVIRONMENT=node"
	@npx mocha
