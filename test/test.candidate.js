var assert = require('assert');
var candidate = require('../src/crxuk/candidate');

describe('candidate', function() {
	it('test candidate lib', function() {
		var c = new candidate.Candidate();
		c.load([
			"thông thường",
			"ttham tan",
			"Tôi tên",
			"Việt Nam",
			"CHỮ VIẾT HOA",
			"Curriculum Vitae",
		]);

		tests = {
			tt: [0, 1, 2],
			th: [0, 1],
			tth: [1],
			vn: [3],
			cv: [4, 5],
		}

		for (var k in tests) {
			var m = c.match(k).map(d => d[0]);
			assert.deepEqual(m, tests[k]);
		}
	});
});
