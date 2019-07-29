var assert = require('assert');

var libunikey = require('../build/libunikey-test');
var crxuk = require('../src/crxuk');

var KEY = function(key, code, ctrl, alt) {
	return {
		type: 'keydown',
		key: key,
		code: code || ('Key' + key),
		ctrlKey: ctrl || false,
		altKey: alt || false,
	}
}

var sendKeys = function(c, engine, keys) {
	for (var i = 0; i < keys.length; i++) {
		switch (keys[i]) {
			case 'Ctrl+Enter':
				var k1 = KEY('Ctrl', null, true);
				c.onKeyEvent(engine, k1);

				var k2 = KEY('Enter', null, true);
				c.onKeyEvent(engine, k2);

				k2.type = 'keyup';
				c.onKeyEvent(engine, k2);

				k1.type = 'keyup';
				c.onKeyEvent(engine, k1);
				break;
			default:
				var k = KEY(keys[i]);
				c.onKeyEvent(engine, k);
				k.type = 'keyup';
				c.onKeyEvent(engine, k);
				break;
		}
	}
}

var txtCommitted = '';
var txtComposition;

var fakeIme = {
	commitText: function(data) {
		txtCommitted += data.text;
	},
	setComposition: function(data) {
		txtComposition = data.text;
	},
	setCandidateWindowProperties: function(props) {},
	setCandidates: function(data) {},
	setCursorPosition: function(data) {},
	setMenuItems: function(menu) {},
}

var fakeChrome = {
	input: { ime: fakeIme },
	storage: {
		sync: {
			get: function(keys, callback) {},
		},
		local: {
			get: function(keys, callback) {
				let data = {};
				for (var i = 0; i < keys.length; i++) {
					if (keys[i] == 'suggestion_0') {
						data[keys[i]] = `
thônG thường
tHi thoang
thi thoAng2
						`;
					}
				}

				callback(data);
			},
		},
		onChanged: {
			addListener: function(changes, areaName) {},
		}
	},
}

describe('crxuk module', function() {
	describe('test input', function() {
		it('test engine: invalid', function() {
			txtCommitted = '';
			txtComposition = '';

			var engine = 'unikey-invalid';
			var c = new crxuk.ChromeUnikey(fakeChrome, libunikey);

			try {
				c.onActivate(engine);
			} catch (e) {
				if (!e.message.includes('invalid engineID')) {
					throw e;
				}
				return;
			}
			throw Error("should have error")
		});

		it('test engine: telex', function() {
			txtCommitted = '';
			txtComposition = '';

			var engine = 'unikey-telex';
			var c = new crxuk.ChromeUnikey(fakeChrome, libunikey);
			c.onActivate(engine);

			try {
				c.onFocus({contextID: 1});

				sendKeys(c, engine, 'thuongwr');
				assert.equal(txtComposition, 'thưởng');
				assert.equal(txtCommitted, '');

				c.onKeyEvent(engine, KEY(' ', 'Space'));
				assert.equal(txtComposition, 'thưởng');
				assert.equal(txtCommitted, 'thưởng ');
			} finally {
				c.onBlur(1);
				txtCommitted = '';
			}

			try {
				c.onFocus(2);
				sendKeys(c, engine, 'thuongwr.');
				assert.equal(txtComposition, 'thưởng');
				assert.equal(txtCommitted, 'thưởng.');
			} finally {
				c.onBlur(2);
			}
		});

		it('test engine: vni', function() {
			txtCommitted = '';
			txtComposition = '';

			var engine = 'unikey-vni';
			var c = new crxuk.ChromeUnikey(fakeChrome, libunikey);
			c.onActivate(engine);
			c.onFocus({contextID: 1});

			sendKeys(c, engine, 'thuong73');
			assert.equal(txtComposition, 'thưởng');
			assert.equal(txtCommitted, '');

			c.onKeyEvent(engine, KEY(' ', 'Space'));
			assert.equal(txtComposition, 'thưởng');
			assert.equal(txtCommitted, 'thưởng ');
		});

		it('test backspace', function() {
			txtCommitted = '';
			txtComposition = '';

			var engine = 'unikey-telex';
			var c = new crxuk.ChromeUnikey(fakeChrome, libunikey);
			c.onActivate(engine);
			c.onFocus({contextID: 1});

			sendKeys(c, engine, 'thuongwr');
			assert.equal(txtComposition, 'thưởng');
			assert.equal(txtCommitted, '');

			c.onKeyEvent(engine, KEY('Backspace'));
			assert.equal(txtComposition, 'thưởn');
			assert.equal(txtCommitted, '');
		});

		it('restore keystroke with shift-shift', function() {
			txtCommitted = '';
			txtComposition = '';

			var engine = 'unikey-telex';
			var c = new crxuk.ChromeUnikey(fakeChrome, libunikey);
			c.onActivate(engine);

			c.onFocus({contextID: 1});

			sendKeys(c, engine, 'thuongwr');
			assert.equal(txtComposition, 'thưởng');
			assert.equal(txtCommitted, '');

			sendKeys(c, engine, ['Shift']);
			sendKeys(c, engine, ['Shift']);
			assert.equal(txtComposition, 'thưởng');

			c.onKeyEvent(engine, KEY('Shift', 'LeftShift'));
			assert.equal(txtComposition, 'thưởng');
			c.onKeyEvent(engine, KEY('Shift', 'RightShift'));
			assert.equal(txtComposition, 'thuongwr');
		});
	});

	describe('suggestion feature', function() {
		var engine = 'unikey-telex';
		var fakeChrome2 = Object.assign({}, fakeChrome);
		fakeChrome2.storage.sync.get = function(keys, callback) {
			callback({
				crxuk: {
					suggestion: {
						enabled: true,
						useHkArrow: true,
						useHkNumber: true,
						useHkSwitch: true,
						autoResetSwitch: true,
					},
				}
			})
		}

		var c = new crxuk.ChromeUnikey(fakeChrome2, libunikey);
		c.onActivate(engine);
		c.onFocus({contextID: 1});

		it('basic', function() {
			txtCommitted = '';
			sendKeys(c, engine, ['t', 't', 'Ctrl+Enter']);
			assert.equal(txtCommitted, 'thônG thường');
		});

		it('touch/mouse click', function() {
			txtCommitted = '';
			sendKeys(c, engine, 'tt');
			c.onCandidateClicked(engine, 1, 'Left');
			assert.equal(txtCommitted, 'tHi thoang');
		});

		it('Down key', function() {
			txtCommitted = '';
			sendKeys(c, engine, ['t', 't', 'Down', 'Ctrl+Enter']);
			assert.equal(txtCommitted, 'tHi thoang');
		});

		it('Up key', function() {
			txtCommitted = '';
			sendKeys(c, engine, ['t', 't', 'Up', 'Ctrl+Enter']);
			assert.equal(txtCommitted, 'thi thoAng2');
		});

		it('Up key then more key', function() {
			txtCommitted = '';
			sendKeys(c, engine, ['t', 'h', 'Up', 'o', 'Ctrl+Enter']);
			assert.equal(txtCommitted, 'thônG thường');
		});

		it('use ctrl + <num>', function() {
			txtCommitted = '';
			sendKeys(c, engine, 'tt');
			c.onKeyEvent(engine, KEY('2', null, true));
			assert.equal(txtCommitted, 'tHi thoang');
		});

		it('change text case', function() {
			txtCommitted = '';
			sendKeys(c, engine, 'tho');
			c.onKeyEvent(engine, KEY('`', null, true));
			sendKeys(c, engine, ['Ctrl+Enter']);
			assert.equal(txtCommitted, 'THÔNG THƯỜNG');

			txtCommitted = '';
			sendKeys(c, engine, 'tho');
			sendKeys(c, engine, ['Ctrl+Enter']);
			assert.equal(txtCommitted, 'thônG thường');
		});

		it('remove tone', function() {
			txtCommitted = '';
			sendKeys(c, engine, 'th');
			c.onKeyEvent(engine, KEY('~', null, true));
			sendKeys(c, engine, ['Ctrl+Enter']);
			assert.equal(txtCommitted, 'thonG thuong');
		});

		it('no suggestion', function() {
			var fakeChrome2 = Object.assign({}, fakeChrome);
			fakeChrome2.storage.sync.get = function(keys, callback) {
				callback({ crxuk: { suggestion: { enabled: false, }, } })
			}

			var c = new crxuk.ChromeUnikey(fakeChrome2, libunikey);
			c.onActivate(engine);
			c.onFocus({contextID: 1});

			txtCommitted = '';
			sendKeys(c, engine, ['t', 't', 'Ctrl+Enter']);
			assert.equal(txtCommitted, 'tt');
		});

		it('disable select use Arrow + Enter hotkey', function() {
			var fakeChrome2 = Object.assign({}, fakeChrome);
			fakeChrome2.storage.sync.get = function(keys, callback) {
				callback({ crxuk: { suggestion: { enabled: true, useHkArrow: false, }, } })
			}

			var c = new crxuk.ChromeUnikey(fakeChrome2, libunikey);
			c.onActivate(engine);
			c.onFocus({contextID: 1});

			// useHkArrow
			txtCommitted = '';
			sendKeys(c, engine, ['t', 't', 'Ctrl+Enter']);
			assert.equal(txtCommitted, 'tt');

			// useHkNumber
			txtCommitted = '';
			sendKeys(c, engine, 'tt');
			c.onKeyEvent(engine, KEY('2', null, true));
			assert.equal(txtCommitted, 'tHi thoang');

			// useHkSwitch + mouse
			txtCommitted = '';
			sendKeys(c, engine, 'tt');
			c.onKeyEvent(engine, KEY('`', null, true));
			c.onKeyEvent(engine, KEY('~', null, true));
			c.onCandidateClicked(engine, 0, 'Left');
			assert.equal(txtCommitted, 'THONG THUONG');
		});

		it('disable ctrl + <num> hotkey', function() {
			var fakeChrome2 = Object.assign({}, fakeChrome);
			fakeChrome2.storage.sync.get = function(keys, callback) {
				callback({ crxuk: { suggestion: { enabled: true, useHkNumber: false, }, } })
			}

			var c = new crxuk.ChromeUnikey(fakeChrome2, libunikey);
			c.onActivate(engine);
			c.onFocus({contextID: 1});

			// useHkArrow
			txtCommitted = '';
			sendKeys(c, engine, ['t', 't', 'Ctrl+Enter']);
			assert.equal(txtCommitted, 'thônG thường');

			// useHkNumber
			txtCommitted = '';
			sendKeys(c, engine, 'tt');
			c.onKeyEvent(engine, KEY('2', null, true));
			assert.equal(txtCommitted, 'tt');

			// useHkSwitch + mouse
			txtCommitted = '';
			sendKeys(c, engine, 'tt');
			c.onKeyEvent(engine, KEY('`', null, true));
			c.onKeyEvent(engine, KEY('`', null, true));
			c.onKeyEvent(engine, KEY('~', null, true));
			c.onCandidateClicked(engine, 0, 'Left');
			assert.equal(txtCommitted, 'thong thuong');
		});

		it('disable switch case hotkey', function() {
			var fakeChrome2 = Object.assign({}, fakeChrome);
			fakeChrome2.storage.sync.get = function(keys, callback) {
				callback({ crxuk: { suggestion: { enabled: true, useHkSwitch: false, }, } })
			}

			var c = new crxuk.ChromeUnikey(fakeChrome2, libunikey);
			c.onActivate(engine);
			c.onFocus({contextID: 1});

			// useHkArrow
			txtCommitted = '';
			sendKeys(c, engine, ['t', 't', 'Ctrl+Enter']);
			assert.equal(txtCommitted, 'thônG thường');

			// useHkNumber
			txtCommitted = '';
			sendKeys(c, engine, 'tt');
			c.onKeyEvent(engine, KEY('2', null, true));
			assert.equal(txtCommitted, 'tHi thoang');

			// useHkSwitch
			txtCommitted = '';
			sendKeys(c, engine, 'tt');
			c.onKeyEvent(engine, KEY('`', null, true));
			assert.equal(txtCommitted, 'tt');
		});

		it('disable auto reset switch', function() {
			var fakeChrome2 = Object.assign({}, fakeChrome);
			fakeChrome2.storage.sync.get = function(keys, callback) {
				callback({ crxuk: { suggestion: { enabled: true, autoResetSwitch: false, }, } })
			}

			var c = new crxuk.ChromeUnikey(fakeChrome2, libunikey);
			c.onActivate(engine);
			c.onFocus({contextID: 1});

			txtCommitted = '';
			sendKeys(c, engine, 'tt');
			c.onKeyEvent(engine, KEY('`', null, true));
			c.onKeyEvent(engine, KEY('~', null, true));
			c.onCandidateClicked(engine, 0, 'Left');
			assert.equal(txtCommitted, 'THONG THUONG');

			txtCommitted = '';
			sendKeys(c, engine, 'tt');
			c.onCandidateClicked(engine, 0, 'Left');
			assert.equal(txtCommitted, 'THONG THUONG');
		});
	});
});
