var stringutil = require('./stringutil');

class Candidate {
	constructor() {
		this._items = [];
		this._kw1 = [];
		this._kw2 = [];
	}

	load(data) {
		if (typeof data == 'string') {
			data = data.split('\n');
		}

		data = data.filter(s => s.trim().length > 0);

		this._items = data;
		this._kw1 = [];
		this._kw2 = [];
		for (var i = 0; i < this._items.length; i++) {
			let s = this._items[i];
			s = stringutil.slugify(s);
			let stoken = s.split('-');
			let s2 = '';
			for (var j = 0; j < stoken.length; j++) {
				if (stoken[j].length > 0)
					s2 += stoken[j][0];
			}

			this._kw1.push(s2);
			this._kw2.push(s);
		}
	}

	match(key) {
		key = stringutil.slugify(key);

		var result = [];

		if (key.length <= 1) {
			return [];
		}

		// match by kw1: prefix of each token
		for (var i = 0; i < this._kw1.length; i++) {
			var s = this._kw1[i];
			if (s.indexOf(key) == 0) {
				result.push(i);
			}
		}

		// match by kw2: prefix
		for (var i = 0; i < this._kw2.length; i++) {
			if (result.includes(i))
				continue;

			var s = this._kw2[i];
			if (s.indexOf(key) == 0) {
				result.push(i);
			}
		}

		// match by kw2: contains
		for (var i = 0; i < this._kw2.length; i++) {
			if (result.includes(i))
				continue;

			var s = this._kw2[i];
			if (s.replace('-', '').indexOf(key) >= 0) {
				result.push(i);
			}
		}

		return result.map(x => [x, this._items[x]]);
	}

	get(id) {
		return this._items[id];
	}
}

module.exports = {
	Candidate,
}
