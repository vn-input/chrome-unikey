var ime_api = chrome.input.ime;

if (ime_api.onActivate && ime_api.onFocus && ime_api.onBlur && ime_api.onKeyEvent && ime_api.onMenuItemActivated) {
	var crxuk = require('./crxuk');

	crxuk.init(chrome);

	ime_api.onActivate.addListener(crxuk.onActivate);
	ime_api.onFocus.addListener(crxuk.onFocus);
	ime_api.onBlur.addListener(crxuk.onBlur);
	ime_api.onKeyEvent.addListener(crxuk.onKeyEvent);
	ime_api.onMenuItemActivated.addListener(crxuk.onMenuItemActivated);

	chrome.runtime.getPlatformInfo(function(info) {
		if (info.os != 'cros') {
			ime_api.onActivate.removeListener(crxuk.onActivate);
			ime_api.onFocus.removeListener(crxuk.onFocus);
			ime_api.onBlur.removeListener(crxuk.onBlur);
			ime_api.onKeyEvent.removeListener(crxuk.onKeyEvent);
			ime_api.onMenuItemActivated.removeListener(crxuk.onMenuItemActivated);
		}
	});
}
