
const KEY_SPELLCHECK = "spellcheck";
const KEY_AUTORESTORE = "auto_restore_non_vn";
const KEY_MODERN_STYLE = "modern_style";
const KEY_UNIKEY_OPTIONS = "unikey_options";

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
			}
		}

		this.unikey = new libunikey.SimpleUnikey();

		this.unikey_opts = {
			spellcheck: false,
			auto_restore_non_vn: false,
			modern_style: false,
		};

		this.contextID = -1;

		this.menuItems = this._buildOptionMenu();
		this.menu = {
			engineID: '',
			items: [
				this.menuItems[KEY_SPELLCHECK],
				this.menuItems[KEY_AUTORESTORE],
				this.menuItems[KEY_MODERN_STYLE],
			]
		}

		this.storage_api.sync.get([KEY_UNIKEY_OPTIONS], result => {
			if (!(KEY_UNIKEY_OPTIONS in result)) {
				return;
			}
			var new_opts = result[KEY_UNIKEY_OPTIONS];
			for (var k in new_opts) {
				this.unikey_opts[k] = new_opts[k];
			}
			this.updateMenuItems();
		});
	}

	_buildOptionMenu() {
		var items = {}
		items[KEY_SPELLCHECK] = {
			id: KEY_SPELLCHECK,
			label: "Spellcheck",
			style: "check",
			checked: false,
		}
		items[KEY_AUTORESTORE] = {
			id: KEY_AUTORESTORE,
			label: "Auto restore non Vietnamese",
			style: "check",
			checked: false,
		}
		items[KEY_MODERN_STYLE] = {
			id: KEY_MODERN_STYLE,
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

	updateComposition() {
		var r = this.unikey.get_result();
		this.ime_api.setComposition({
			"contextID": this.contextID,
			"text": r,
			"cursor": r.length,
		});
	}

	commitAndReset() {
		this.ime_api.commitText({
			"contextID": this.contextID,
			"text": this.unikey.get_result(),
		});
		this.unikey.reset();
	}

	onMenuItemActivated(engineID, menuId) {
		this.unikey_opts[menuId] = !this.unikey_opts[menuId];

		if (menuId == KEY_SPELLCHECK && !this.unikey_opts[menuId]) {
			// disable autorestore if spellcheck disabled
			this.unikey_opts[KEY_AUTORESTORE] = false;
		} else if (menuId == KEY_AUTORESTORE && this.unikey_opts[menuId]) {
			// enable spellcheck if enable autorestore
			this.unikey_opts[KEY_SPELLCHECK] = true;
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
		this.pressedKeyCodes = new Set([]);
		this.lastKeyData = null;
	}

	onBlur(contextID) {
		this.contextID = -1;
	}

	onKeyEvent(engineID, keyData) {

		if (keyData.type == "keyup") {
			if (this.pressedKeyCodes.size == 1
				&& this.lastKeyData.key == 'Ctrl'
				&& keyData.key == 'Ctrl') {
				this.commitAndReset();
			}

			this.pressedKeyCodes.delete(keyData.code);
			this.lastKeyData = keyData;
			return false;
		}

		this.pressedKeyCodes.add(keyData.code);
		this.lastKeyData = keyData;

		if (keyData.key == "Shift") {
			let iter = this.pressedKeyCodes.values();
			if (this.pressedKeyCodes.size == 2
					&& iter.next().value.indexOf('Shift') >= 0
					&& iter.next().value.indexOf('Shift') >= 0) {
				this.unikey.restore();
				this.updateComposition();
			}
			return false;
		}

		if (keyData.key == "Backspace" && this.unikey.get_result() != "") {
			this.unikey.process_backspace();
			this.updateComposition();
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
				|| keyData.code.match(/(AudioVolume|Brightness|Zoom|MediaPlay)/)) {
			return false;
		}

		this.commitAndReset();

		return false;
	}
}

module.exports = {
	ChromeUnikey,
}
