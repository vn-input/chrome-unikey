EMCC ?= emcc

SOURCE_DIR = $(shell pwd)
BUILD_DIR = $(SOURCE_DIR)/build

LIBUNIKEY_LIB = $(BUILD_DIR)/libunikey/src/libunikey.a
LIBUNIKEY_INC = -I $(SOURCE_DIR)/libunikey/src

BASE_EMCC = $(EMCC) embind.cpp --bind $(LIBUNIKEY_LIB) $(LIBUNIKEY_INC) \
	-s ENVIRONMENT=web \
	-s MODULARIZE_INSTANCE=1 \
	-s EXPORT_NAME=LibUnikey \
	-s WASM=0 \
	--memory-init-file 0

.PHONY: all release debug clean libunikey test

all: debug release

debug: libunikey
	@$(RM) -r $(BUILD_DIR)/$@
	@cp -r template $(BUILD_DIR)/$@

	@sed -i.bak -E "s/__VERSION__/`node -p "require('./package.json').version"`.`date +%M%S`/" $(BUILD_DIR)/$@/manifest.json
	@sed -i.bak -E 's/__MSG_appName__/\0 DEBUG/ ; s/Vietnamese[^"]*/\0 DEBUG/' $(BUILD_DIR)/$@/manifest.json
	@rm -f $(BUILD_DIR)/$@/manifest.json.bak

	@npx webpack --config webpack.dev.js --output $(BUILD_DIR)/$@/main.js
	@$(BASE_EMCC) -o $(BUILD_DIR)/$@/unikey.js -O0

release: libunikey
	@$(RM) -r $(BUILD_DIR)/$@
	@cp -r template $(BUILD_DIR)/$@

	@sed -i.bak -E "s/__VERSION__/`node -p "require('./package.json').version"`/" $(BUILD_DIR)/$@/manifest.json
	@rm -f $(BUILD_DIR)/$@/manifest.json.bak

	@npx webpack --config webpack.prod.js --output $(BUILD_DIR)/$@/main.js
	@$(BASE_EMCC) -o $(BUILD_DIR)/$@/unikey.js -O3
	@$(RM) $(BUILD_DIR)/$@.zip && (cd $(BUILD_DIR)/$@ && zip -r ../$@.zip *)

libunikey:
	@mkdir -p $(BUILD_DIR)/libunikey
	@(cd $(BUILD_DIR)/libunikey && CC="$(EMXX)" CXX="$(EMCC)" cmake $(SOURCE_DIR)/libunikey && make)

clean:
	@(cd $(BUILD_DIR) && $(RM) -r release release.zip debug libunikey *.js)

test:
	@$(BASE_EMCC) -o $(BUILD_DIR)/libunikey-test.js -O0 -s "ENVIRONMENT=node"
	@npx mocha
