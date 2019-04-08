DEFAULT_UNIKEY_OPTIONS = {
	spellcheck: false,
	auto_restore_non_vn: false,
	modern_style: false,
}

DEFAULT_CRXUK_OPTIONS = {
	suggestion: {
		enabled: false,
		useHkArrow: true,
		useHkNumber: true,
		useHkSwitch: true,
		autoResetSwitch: true,
	},
}

module.exports = {
	DEFAULT_UNIKEY_OPTIONS,
	DEFAULT_CRXUK_OPTIONS,
	KEY_SPELLCHECK: "spellcheck",
	KEY_AUTORESTORE: "auto_restore_non_vn",
	KEY_MODERN_STYLE: "modern_style",
	KEY_UNIKEY_OPTIONS: "unikey_options",
	KEY_CRXUK_OPTIONS: "crxuk",
	KEY_SUGGESTION_PREFIX: "suggestion_",
}
