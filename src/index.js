chrome.runtime.getPlatformInfo(function(info) {
	if (info.os == 'cros') {
		var crxuk = require('./crxuk');
		var ime_api = chrome.input.ime;

		var unikey = new crxuk.ChromeUnikey(chrome, LibUnikey);

		ime_api.onActivate.addListener(unikey.onActivate.bind(unikey));
		ime_api.onFocus.addListener(unikey.onFocus.bind(unikey));
		ime_api.onBlur.addListener(unikey.onBlur.bind(unikey));
		ime_api.onReset.addListener(unikey.onReset.bind(unikey));
		ime_api.onKeyEvent.addListener(unikey.onKeyEvent.bind(unikey));
		ime_api.onMenuItemActivated.addListener(unikey.onMenuItemActivated.bind(unikey));
		ime_api.onCandidateClicked.addListener(unikey.onCandidateClicked.bind(unikey));

		let compareVer = function(v1, v2) {
			let a1 = v1.split('.').map(i=>parseInt(i, 10))
			let a2 = v2.split('.').map(i=>parseInt(i, 10))

			let len = Math.max(a1.length, a2.length)
			for (let i = 0; i < len; i++) {
				let x1 = a1[i]||0
				let x2 = a2[i]||0
				if (x1 > x2) {
					return 1
				} else if (x1 < x2) {
					return -1
				}
			}
			return 0
		}
		chrome.runtime.onInstalled.addListener(function(detail) {
			if (detail.reason == "install" ||
				(detail.reason == "update" && compareVer(detail.previousVersion, "0.6.0.9999") <= 0 )
				)
			chrome.tabs.create({url: "options.html"})
		})
	}
});
