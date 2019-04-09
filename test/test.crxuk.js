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

var txtCommitted = '';
var txtComposition;

var fakeIme = {
	commitText: function(data) {
		txtCommitted += data.text;
	},
	setComposition: function(data) {
		txtComposition = data.text;
	},
	setMenuItems: function(menu) {},
}

var fakeChrome = {
	input: { ime: fakeIme },
	storage: { sync: {
		get: function(keys, callback) {},
	} },
}

var sendKeys = function(c, engine, keys) {
	for (var i = 0; i < keys.length; i++) {
		var k = KEY(keys[i]);
		c.onKeyEvent(engine, k);
		k.type = 'keyup';
		c.onKeyEvent(engine, k);
	}
}

describe('crxuk module', function() {
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
		}

	});

	it('test engine: telex', function() {
		txtCommitted = '';
		txtComposition = '';

		var engine = 'unikey-telex';
		var c = new crxuk.ChromeUnikey(fakeChrome, libunikey);
		c.onActivate(engine);

		try {
			c.onFocus(1);

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

		try {
			c.onFocus(1);

			sendKeys(c, engine, 'thuong73');
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
			sendKeys(c, engine, 'thuong73.');
			assert.equal(txtComposition, 'thưởng');
			assert.equal(txtCommitted, 'thưởng.');
		} finally {
			c.onBlur(2);
		}
	});

	it('test backspace', function() {
		txtCommitted = '';
		txtComposition = '';

		var engine = 'unikey-telex';
		var c = new crxuk.ChromeUnikey(fakeChrome, libunikey);
		c.onActivate(engine);

		try {
			c.onFocus(1);

			sendKeys(c, engine, 'thuongwr');
			assert.equal(txtComposition, 'thưởng');
			assert.equal(txtCommitted, '');

			c.onKeyEvent(engine, KEY('Backspace'));
			assert.equal(txtComposition, 'thưởn');
			assert.equal(txtCommitted, '');
		} finally {
			c.onBlur(1);
		}
	});

	it('restore keystroke with shift-shift', function() {
		txtCommitted = '';
		txtComposition = '';

		var engine = 'unikey-telex';
		var c = new crxuk.ChromeUnikey(fakeChrome, libunikey);
		c.onActivate(engine);

		try {
			c.onFocus(1);

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

		} finally {
			c.onBlur(1);
		}
	});
});
