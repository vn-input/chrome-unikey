EMCC ?= emcc

SOURCE_DIR = $(shell pwd)
BUILD_DIR ?= build
LIBUNIKEY_LIB = $(BUILD_DIR)/libunikey/src/libunikey.a
LIBUNIKEY_INC = -I $(SOURCE_DIR)/libunikey/src

.PHONY: all release debug clean libunikey

all: release debug

release: libunikey
	@$(RM) -r $(BUILD_DIR)/$@
	@cp -r template $(BUILD_DIR)/$@
	@$(EMCC) embind.cpp --bind $(LIBUNIKEY_LIB) $(LIBUNIKEY_INC) -O3 --memory-init-file 0 -s WASM=0 --post-js main.js -o $(BUILD_DIR)/$@/main.js
	@$(RM) $(BUILD_DIR)/$@.zip && (cd $(BUILD_DIR)/$@ && zip -r ../$@.zip *)

debug: libunikey
	@$(RM) -r $(BUILD_DIR)/$@
	@cp -r template $(BUILD_DIR)/$@
	@$(EMCC) embind.cpp --bind $(LIBUNIKEY_LIB) $(LIBUNIKEY_INC) -O0 --memory-init-file 0 -s WASM=0 --post-js main.js -o $(BUILD_DIR)/$@/main.js

clean:
	@(cd $(BUILD_DIR) && $(RM) -r release release.zip debug libunikey)

libunikey:
	@mkdir -p $(BUILD_DIR)/libunikey
	@(cd $(BUILD_DIR)/libunikey && CC="$(EMXX)" CXX="$(EMCC)" cmake $(SOURCE_DIR)/libunikey && make)
