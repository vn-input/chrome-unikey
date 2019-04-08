function _toAscii1(s) {
	s = s.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/g, 'a');
	s = s.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, 'o');
	s = s.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, 'e');
	s = s.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, 'u');
	s = s.replace(/í|ì|ỉ|ĩ|ị/g, 'i');
	s = s.replace(/ý|ỳ|ỷ|ỹ|ỵ/g, 'y');
	s = s.replace(/đ/g, 'd');
	return s;
}

function _toAscii2(s) {
	s = s.replace(/Á|À|Ả|Ạ|Ã|Ă|Ắ|Ằ|Ẳ|Ẵ|Ặ|Â|Ấ|Ầ|Ẩ|Ẫ|Ậ/g, 'A');
	s = s.replace(/Ó|Ò|Ỏ|Õ|Ọ|Ô|Ố|Ồ|Ổ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ở|Ỡ|Ợ/g, 'O');
	s = s.replace(/É|È|Ẻ|Ẽ|Ẹ|Ê|Ế|Ề|Ể|Ễ|Ệ/g, 'E');
	s = s.replace(/Ú|Ù|Ủ|Ũ|Ụ|Ư|Ứ|Ừ|Ử|Ữ|Ự/g, 'U');
	s = s.replace(/Í|Ì|Ỉ|Ĩ|Ị/g, 'I');
	s = s.replace(/Ý|Ỳ|Ỷ|Ỹ|Ỵ/g, 'Y');
	s = s.replace(/Đ/g, 'D');
	return s;
}

function toAscii(s) {
	return _toAscii1(_toAscii2(s));
}

function slugify(s) {
	s = s.toLowerCase()
	s = _toAscii1(s)
	s = s.replace(/[^a-z0-9]/g, '-');
	return s;
}

module.exports = {
	toAscii,
	slugify,
}
