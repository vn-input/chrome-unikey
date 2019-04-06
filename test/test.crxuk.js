var assert = require('assert');

var libunikey = require('../build/libunikey-test');
var crxuk = require('../src/crxuk');

var KEY = function(key, code, ctrl, alt) {
	return {
		type: 'keydown',
		key: key,
		code: code || key,
		ctrlKey: ctrl || false,
		altKey: alt || false,
	}
}

var txtCommitted = ''
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

var sendKeys = function(engine, keys) {
	for (var i = 0; i < keys.length; i++) {
		var k = KEY(keys[i]);
		crxuk.onKeyEvent(engine, k);
		k.type = 'keyup';
		crxuk.onKeyEvent(engine, k);
	}
}

describe('crxuk module', function() {
	describe('basic', function() {

		it('invalid engine', function() {
			txtCommitted = '';
			txtComposition = '';

			var engine = 'unikey-invalid';
			crxuk.init(fakeChrome, libunikey);

			try {
				crxuk.onActivate(engine);
			} catch (e) {
				if (!e.message.includes('invalid engineID')) {
					throw e;
				}
			}

		});

		it('telex engine 1', function() {
			txtCommitted = '';
			txtComposition = '';

			var engine = 'unikey-telex';
			crxuk.init(fakeChrome, libunikey);
			crxuk.onActivate(engine);

			try {
				crxuk.onFocus(1);

				sendKeys(engine, 'thuongwr');
				assert.equal(txtComposition, 'thưởng');
				assert.equal(txtCommitted, '');

				crxuk.onKeyEvent(engine, KEY(' ', 'Space'));
				assert.equal(txtComposition, 'thưởng');
				assert.equal(txtCommitted, 'thưởng ');
			} finally {
				crxuk.onBlur(1);
				txtCommitted = '';
			}

			try {
				crxuk.onFocus(2);
				sendKeys(engine, 'thuongwr.');
				assert.equal(txtComposition, 'thưởng');
				assert.equal(txtCommitted, 'thưởng.');
			} finally {
				crxuk.onBlur(2);
			}
		});

		it('restore keystroke with shift-shift', function() {
			txtCommitted = '';
			txtComposition = '';

			var engine = 'unikey-telex';
			crxuk.init(fakeChrome, libunikey);
			crxuk.onActivate(engine);

			try {
				crxuk.onFocus(1);

				sendKeys(engine, 'thuongwr');
				assert.equal(txtComposition, 'thưởng');
				assert.equal(txtCommitted, '');

				sendKeys(engine, ['Shift']);
				sendKeys(engine, ['Shift']);
				assert.equal(txtComposition, 'thưởng');

				crxuk.onKeyEvent(engine, KEY('Shift', 'LeftShift'));
				assert.equal(txtComposition, 'thưởng');
				crxuk.onKeyEvent(engine, KEY('Shift', 'RightShift'));
				assert.equal(txtComposition, 'thuongwr');

			} finally {
				crxuk.onBlur(1);
			}
		});
	});
});
