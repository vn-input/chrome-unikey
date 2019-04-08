var ime_api = chrome.input.ime;

if (ime_api.onActivate && ime_api.onFocus && ime_api.onBlur && ime_api.onKeyEvent && ime_api.onMenuItemActivated) {
	var crxuk = require('./crxuk');

	var unikey = new crxuk.ChromeUnikey(chrome, LibUnikey);
	var onActivate = unikey.onActivate.bind(unikey);
	var onFocus = unikey.onFocus.bind(unikey);
	var onBlur = unikey.onBlur.bind(unikey);
	var onKeyEvent = unikey.onKeyEvent.bind(unikey);
	var onMenuItemActivated = unikey.onMenuItemActivated.bind(unikey);
	var onCandidateClicked = unikey.onCandidateClicked.bind(unikey);

	ime_api.onActivate.addListener(onActivate);
	ime_api.onFocus.addListener(onFocus);
	ime_api.onBlur.addListener(onBlur);
	ime_api.onKeyEvent.addListener(onKeyEvent);
	ime_api.onMenuItemActivated.addListener(onMenuItemActivated);
	ime_api.onCandidateClicked.addListener(onCandidateClicked);

	chrome.runtime.getPlatformInfo(function(info) {
		if (info.os != 'cros') {
			ime_api.onActivate.removeListener(onActivate);
			ime_api.onFocus.removeListener(onFocus);
			ime_api.onBlur.removeListener(onBlur);
			ime_api.onKeyEvent.removeListener(onKeyEvent);
			ime_api.onMenuItemActivated.removeListener(onMenuItemActivated);
			ime_api.onCandidateClicked.removeListener(onCandidateClicked);
		}
	});
}
