var Candidate = require('./candidate').Candidate;
var stringutil = require('./stringutil');
var V = require('./variables');

const WORD_CASE_DEFAULT = -1;
const WORD_CASE_ORIGIN = 0;
const WORD_CASE_UPPER = 1;
const WORD_CASE_LOWER = 2;
const WORD_CASE_MAX = 3;

const WORD_CASES = {}
WORD_CASES[WORD_CASE_DEFAULT] = "DEFAULT";
WORD_CASES[WORD_CASE_ORIGIN] = "ORIGINAL";
WORD_CASES[WORD_CASE_UPPER] = "UPPER";
WORD_CASES[WORD_CASE_LOWER] = "LOWER";

var INPUT_METHODS;

class ChromeUnikey {
	constructor(chrome, libunikey) {
		this.ime_api = chrome.input.ime;
		this.storage_api = chrome.storage;

		if (!INPUT_METHODS) {
			INPUT_METHODS = {
				"unikey-telex": {
					id: libunikey.InputMethod.TELEX,
					keys: /^[a-zA-Z{}\[\]]$/,
				},
				"unikey-telex-simple": {
					id: libunikey.InputMethod.TELEX_SIMPLE,
					keys: /^[a-zA-Z]$/,
				},
				"unikey-vni": {
					id: libunikey.InputMethod.VNI,
					keys: /^[a-zA-Z0-9]$/,
				},
				"fr-unikey-telex": {
					id: libunikey.InputMethod.TELEX,
					keys: /^[a-zA-Z{}\[\]]$/,
				},
				"fr-unikey-telex-simple": {
					id: libunikey.InputMethod.TELEX_SIMPLE,
					keys: /^[a-zA-Z]$/,
				},
				"fr-unikey-vni": {
					id: libunikey.InputMethod.VNI,
					keys: /^[a-zA-Z0-9]$/,
				}
			}
		}

		this.unikey = new libunikey.SimpleUnikey();

		this.unikey_opts = Object.assign({}, V.DEFAULT_UNIKEY_OPTIONS);
		this.crxukOptions = JSON.parse(JSON.stringify(V.DEFAULT_CRXUK_OPTIONS));

		this.cddMngr = new Candidate();

		this.contextID = -1;

		this.menuItems = this._buildOptionMenu();
		this.menu = {
			engineID: '',
			items: [
				this.menuItems[V.KEY_SPELLCHECK],
				this.menuItems[V.KEY_AUTORESTORE],
				this.menuItems[V.KEY_MODERN_STYLE],
			]
		}

		this.storage_api.sync.get([V.KEY_UNIKEY_OPTIONS, V.KEY_CRXUK_OPTIONS], result => {
			if (result[V.KEY_UNIKEY_OPTIONS]) {
				Object.assign(this.unikey_opts, result[V.KEY_UNIKEY_OPTIONS]);
				this.updateMenuItems();
			}

			if (result[V.KEY_CRXUK_OPTIONS] && result[V.KEY_CRXUK_OPTIONS].suggestion) {
				Object.assign(this.crxukOptions.suggestion, result[V.KEY_CRXUK_OPTIONS].suggestion);
			}
		});

		this.storage_api.local.get([V.KEY_SUGGESTION_PREFIX + 0], result => {
			if (result[V.KEY_SUGGESTION_PREFIX + 0]) {
				this.cddMngr.load(result[V.KEY_SUGGESTION_PREFIX + 0]);
			}
		});

		this.storage_api.onChanged.addListener((changes, areaName) => {
			if (areaName == 'sync') {
				if (changes[V.KEY_UNIKEY_OPTIONS]) {
					Object.assign(this.unikey_opts, changes[V.KEY_UNIKEY_OPTIONS].newValue);
					this.updateMenuItems();
				}
				if (changes[V.KEY_CRXUK_OPTIONS] && changes[V.KEY_CRXUK_OPTIONS].newValue.suggestion) {
					Object.assign(this.crxukOptions.suggestion, changes[V.KEY_CRXUK_OPTIONS].newValue.suggestion);
				}
			} else if (areaName == 'local') {
				if (changes[V.KEY_SUGGESTION_PREFIX + 0]) {
					this.cddMngr.load(changes[V.KEY_SUGGESTION_PREFIX + 0].newValue);
				}
			}
		});

		// candidate
		this.cddList = [];
		this.cddIndex = -1;
		this.cddRemoveTone = false;
		this.cddWordCase = WORD_CASE_DEFAULT;
	}

	_buildOptionMenu() {
		var items = {}
		items[V.KEY_SPELLCHECK] = {
			id: V.KEY_SPELLCHECK,
			label: "Spellcheck",
			style: "check",
			checked: false,
		}
		items[V.KEY_AUTORESTORE] = {
			id: V.KEY_AUTORESTORE,
			label: "Auto restore non Vietnamese",
			style: "check",
			checked: false,
		}
		items[V.KEY_MODERN_STYLE] = {
			id: V.KEY_MODERN_STYLE,
			label: "Modern style (oà, uý)",
			style: "check",
			checked: false,
		}
		return items;
	}

	updateMenuItems() {
		for (var k in this.unikey_opts) {
			this.menuItems[k].checked = this.unikey_opts[k];
		}

		if (this.menu.engineID.length > 0) {
			this.ime_api.updateMenuItems(this.menu);
		}
	}

	getCDDList(kw) {
		var c = 0;

		var cddList = this.cddMngr.match(kw);
		if (cddList.length == 0)
			return [];

		var wordCase = this.cddWordCase;
		if (wordCase == WORD_CASE_DEFAULT) {
			if (kw == kw.toUpperCase()) {
				wordCase = WORD_CASE_UPPER;
			}
		}

		return cddList.map(x => {
			c += 1;

			var s = x[1];

			if (this.cddRemoveTone) {
				s = stringutil.toAscii(s);
			}

			switch (wordCase) {
				case WORD_CASE_LOWER:
					s = s.toLowerCase();
					break;
				case WORD_CASE_UPPER:
					s = s.toUpperCase();
					break;
				// case WORD_CASE_TITLE:
				// 	s = s.toLowerCase().replace(/(^|\s)(\w|[^\u0000-\u007F])/g, c => c.toUpperCase());
				// 	break;
			}

			return {
				id: c - 1,
				candidate: s,
				label: c.toString(),
			}
		});
	}

	updateComposition() {
		var r = this.unikey.get_result();
		if (r.length > 0) {
			this.ime_api.setComposition({
				contextID: this.contextID,
				text: r,
				cursor: r.length,
			});
		} else {
			this.ime_api.clearComposition({
				contextID: this.contextID,
			});
		}

		if (this.crxukOptions.suggestion.enabled) {
			if (this.crxukOptions.suggestion.autoResetSwitch && this.cddList.length == 0) {
				this.cddWordCase = WORD_CASE_DEFAULT;
				this.cddRemoveTone = false;
			}

			this.cddList = this.getCDDList(r);
			this.ime_api.setCandidates({
				contextID: this.contextID,
				candidates: this.cddList,
			});

			var visible = false;
			if (this.cddList.length > 0) {
				visible = true;
				this.cddIndex = 0;
				this.ime_api.setCursorPosition({
					contextID: this.contextID,
					candidateID: this.cddList[0].id,
				});
			}
			this.ime_api.setCandidateWindowProperties({
				engineID: this.menu.engineID,
				properties: {
					visible: visible,
					vertical: true,
					cursorVisible: true,
					windowPosition: "composition",
					auxiliaryText: (this.cddRemoveTone ? "$ " : "") + ('#' + this.cddList.length) + ' ' + WORD_CASES[this.cddWordCase],
					auxiliaryTextVisible: true,
				},
			});
		}
	}

	commitAndReset(text) {
		this.ime_api.commitText({
			contextID: this.contextID,
			text: text || this.unikey.get_result(),
		});
		this.unikey.reset();

		if (this.crxukOptions.suggestion.enabled) {
			this.cddList = [];
			this.ime_api.setCandidates({
				contextID: this.contextID,
				candidates: this.cddList,
			});
			this.ime_api.setCandidateWindowProperties({
				engineID: this.menu.engineID,
				properties: {
					visible: false,
				},
			});
		}
	}

	commitCandidate(cddIndex) {
		var s = this.cddList[cddIndex].candidate;
		this.commitAndReset(s);
	}

	processCandidateHotkey(keyData) {
		if (!this.crxukOptions.suggestion.enabled || this.cddList.length == 0) {
			return false;
		}

		if (this.crxukOptions.suggestion.useHkArrow) {
			if (!keyData.ctrlKey && !keyData.altKey && keyData.key == "Down") {
				this.cddIndex = (this.cddIndex + 1) % this.cddList.length;
				this.ime_api.setCursorPosition({
					contextID: this.contextID,
					candidateID: this.cddList[this.cddIndex].id,
				});
				return true;
			} else if (!keyData.ctrlKey && !keyData.altKey && keyData.key == "Up") {
				this.cddIndex = (this.cddList.length + this.cddIndex - 1) % this.cddList.length;
				this.ime_api.setCursorPosition({
					contextID: this.contextID,
					candidateID: this.cddList[this.cddIndex].id,
				});
				return true;
			} else if (keyData.ctrlKey && !keyData.altKey && keyData.key == "Enter") {
				this.commitCandidate(this.cddIndex);
				return true;
			}
		}

		if (this.crxukOptions.suggestion.useHkNumber) {
			if (keyData.ctrlKey && !keyData.altKey && keyData.key.match(/^[0-9]$/)) {
				var i = parseInt(keyData.key);
				i = (i == 0 ? 10 : i) - 1;
				if (i < this.cddList.length) {
					this.commitCandidate(i);
				}
				return true;
			}
		}

		if (this.crxukOptions.suggestion.useHkSwitch) {
			if (keyData.ctrlKey && !keyData.altKey && keyData.key == '`') {
				if (this.cddWordCase == WORD_CASE_DEFAULT)
					this.cddWordCase = WORD_CASE_ORIGIN;
				this.cddWordCase = (this.cddWordCase + 1) % WORD_CASE_MAX;
				this.updateComposition();
				return true;
			} else if (keyData.ctrlKey && !keyData.altKey && keyData.key == '~') {
				this.cddRemoveTone = !this.cddRemoveTone;
				this.updateComposition();
				return true;
			}
		}

		return false;
	}

	onMenuItemActivated(engineID, menuId) {
		this.unikey_opts[menuId] = !this.unikey_opts[menuId];

		if (menuId == V.KEY_SPELLCHECK && !this.unikey_opts[menuId]) {
			// disable autorestore if spellcheck disabled
			this.unikey_opts[V.KEY_AUTORESTORE] = false;
		} else if (menuId == V.KEY_AUTORESTORE && this.unikey_opts[menuId]) {
			// enable spellcheck if enable autorestore
			this.unikey_opts[V.KEY_SPELLCHECK] = true;
		}

		this.updateMenuItems();
		this.unikey.set_options(this.unikey_opts);
		var save_opts = {};
		for (var k in this.unikey_opts) {
			if (this.unikey_opts[k] == true)
				save_opts[k] = true;
		}
		this.storage_api.sync.set({unikey_options: save_opts});
	}

	onActivate(engineID) {
		if (!(engineID in INPUT_METHODS)) {
			throw Error("invalid engineID: " + engineID);
		}
		this.unikey.set_input_method(INPUT_METHODS[engineID].id);

		this.menu.engineID = engineID;
		this.ime_api.setMenuItems(this.menu);
		this.unikey.set_options(this.unikey_opts);
	}

	onFocus(context) {
		this.contextID = context.contextID;
		this.unikey.reset();
		this.pressedKeyCodes = new Set([]); // still pressed keys
		this.lastKeyData = null; // last up/down key
	}

	onBlur(contextID) {
		this.contextID = -1;

		this.ime_api.setCandidateWindowProperties({
			engineID: this.menu.engineID,
			properties: {
				visible: false,
			},
		});
	}

	onReset(engineID) {
		this.unikey.reset()
	}

	onKeyEvent(engineID, keyData) {
		if (keyData.type == "keyup") {
			// if Ctrl down -> Ctrl up (without any other key pressed)
			if (this.pressedKeyCodes.size == 1 && keyData.key == 'Ctrl' && keyData.code == this.lastKeyData.code) {
				this.commitAndReset();
			}

			this.pressedKeyCodes.delete(keyData.code);
			this.lastKeyData = keyData;
			return false;
		} else {
			return this.onKeyEvent_down(engineID, keyData)
		}
	}

	onKeyEvent_down(engineID, keyData) {
		this.pressedKeyCodes.add(keyData.code);
		this.lastKeyData = keyData;

		if (keyData.key == "Shift") {
			let keys = Array.from(this.pressedKeyCodes);
			// if press both Shift left+right
			if (keys.length == 2 && keys[0].indexOf('Shift') >= 0 && keys[1].indexOf('Shift') >= 0) {
				this.unikey.restore();
				this.updateComposition();
			}
			return false;
		}

		if (!keyData.ctrlKey && !keyData.altKey && keyData.key == "Backspace" && this.unikey.get_result() != "") {
			this.unikey.process_backspace();
			this.updateComposition();
			return true;
		}

		if (this.processCandidateHotkey(keyData)) {
			return true;
		}

		if (!keyData.ctrlKey && !keyData.altKey && keyData.key.length == 1 && keyData.key.charCodeAt(0) > 0) {
			this.unikey.process_char(keyData.key.charCodeAt(0));
			if (keyData.key.match(INPUT_METHODS[engineID].keys)) {
				this.updateComposition();
			} else {
				this.commitAndReset();
			}
			return true;
		}

		// special case not need to commit text
		if ((keyData.ctrlKey && keyData.key == "Ctrl")
				|| (keyData.altKey && keyData.key == "Alt")
				|| (this.unikey.get_result() == "" && keyData.code.match(/Arrow/))
				|| keyData.code.match(/(AudioVolume|Brightness|Zoom|MediaPlay)/)) {
			return false;
		}

		this.commitAndReset();

		return false;
	}

	onCandidateClicked(engineID, candidateID, button) {
		this.commitCandidate(candidateID);
	}
}

module.exports = {
	ChromeUnikey,
}
