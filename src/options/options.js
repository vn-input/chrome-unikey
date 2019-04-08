import './options.scss';

import 'jquery';
import 'popper.js';
import 'bootstrap/js/src/tab';

var V = require('../crxuk/variables');

chrome.runtime.getPlatformInfo(function(info) {
	if (info.os != 'cros') {
		$('#notification').html(`
			<div class="alert alert-warning" role="alert">
			  THIS EXTENSION ONLY WORK ON CHROME OS!
			</div>
		`);
	}
});

var unikey_opts = Object.assign({}, V.DEFAULT_UNIKEY_OPTIONS);
var crxukOptions = JSON.parse(JSON.stringify(V.DEFAULT_CRXUK_OPTIONS));

chrome.storage.sync.get([V.KEY_UNIKEY_OPTIONS, V.KEY_CRXUK_OPTIONS], result => {
	if (V.KEY_UNIKEY_OPTIONS in result) {
		Object.assign(unikey_opts, result[V.KEY_UNIKEY_OPTIONS]);
	}

	if (result[V.KEY_CRXUK_OPTIONS] && result[V.KEY_CRXUK_OPTIONS].suggestion) {
		Object.assign(crxukOptions.suggestion, result[V.KEY_CRXUK_OPTIONS].suggestion);
	}

	$('#spellcheck').prop('checked', unikey_opts[V.KEY_SPELLCHECK]);
	$('#auto-restore').prop('checked', unikey_opts[V.KEY_AUTORESTORE]);
	$('#modern-style').prop('checked', unikey_opts[V.KEY_MODERN_STYLE]);

	$('#suggestion-enabled').prop('checked', crxukOptions.suggestion.enabled);
	$('#suggestion-settings').toggle(crxukOptions.suggestion.enabled);

	$('#useHkArrow').prop('checked', crxukOptions.suggestion.useHkArrow);
	$('#useHkNumber').prop('checked', crxukOptions.suggestion.useHkNumber);
	$('#useHkSwitch').prop('checked', crxukOptions.suggestion.useHkSwitch);
	$('#autoResetSwitch').prop('disabled', !crxukOptions.suggestion.useHkSwitch);
	$('#autoResetSwitch').prop('checked', crxukOptions.suggestion.autoResetSwitch);
});

chrome.storage.local.get([V.KEY_SUGGESTION_PREFIX + 0], result => {
	if (result[V.KEY_SUGGESTION_PREFIX + 0]) {
		$('#suggestion-text').val(result[V.KEY_SUGGESTION_PREFIX + 0]);
	}
});

$(function() {
	$('#spellcheck').change(function() {
		unikey_opts[V.KEY_SPELLCHECK] = this.checked;
		// disable autorestore if spellcheck disabled
		if (!this.checked) {
			unikey_opts[V.KEY_AUTORESTORE] = false;
			$('#auto-restore').prop('checked', false);
		}
		chrome.storage.sync.set({unikey_options: unikey_opts});
	});

	$('#auto-restore').change(function() {
		unikey_opts[V.KEY_AUTORESTORE] = this.checked;
		// enable spellcheck if enable autorestore
		if (this.checked) {
			unikey_opts[V.KEY_SPELLCHECK] = true;
			$('#spellcheck').prop('checked', true);
		}
		chrome.storage.sync.set({unikey_options: unikey_opts});
	});

	$('#modern-style').change(function() {
		unikey_opts[V.KEY_MODERN_STYLE] = this.checked;
		chrome.storage.sync.set({unikey_options: unikey_opts});
	});

	$('#suggestion-enabled').change(function() {
		crxukOptions.suggestion.enabled = this.checked;
		$('#suggestion-settings').toggle(crxukOptions.suggestion.enabled);
		chrome.storage.sync.set({crxuk: crxukOptions});
	});

	$('#useHkArrow').change(function() {
		crxukOptions.suggestion[this.id] = this.checked;
		chrome.storage.sync.set({crxuk: crxukOptions});
	});
	$('#useHkNumber').change(function() {
		crxukOptions.suggestion[this.id] = this.checked;
		chrome.storage.sync.set({crxuk: crxukOptions});
	});
	$('#useHkSwitch').change(function() {
		crxukOptions.suggestion[this.id] = this.checked;
		$('#autoResetSwitch').prop('disabled', !this.checked);
		chrome.storage.sync.set({crxuk: crxukOptions});
	});
	$('#autoResetSwitch').change(function() {
		crxukOptions.suggestion[this.id] = this.checked;
		chrome.storage.sync.set({crxuk: crxukOptions});
	});

	$('#suggestion-save').click(function() {
		let data = {};
		data[V.KEY_SUGGESTION_PREFIX + 0] = $('#suggestion-text').val();
		chrome.storage.local.set(data);
	});

	$('body').show();
});
