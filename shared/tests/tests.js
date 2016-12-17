var assert = require('assert');

suite('tokens', function() {

	test('expiration', function() {

		var vesper = require("../vesper.js");
		var t = {};
		var now = new Date();

		var d = new Date();
		d.setUTCMinutes(now.getUTCMinutes() - 10);
		t.expiration = d.toString();
		t.username = null;
		assert(vesper.tokenIsExpired(t));

		d = new Date();
		d.setUTCMinutes(now.getUTCMinutes() + 10);
		t.expiration = d.toString();
		assert(!vesper.tokenIsExpired(t));

		d = new Date();
		d.setUTCDate(now.getUTCDate() - 1);
		t.expiration = d.toString();
		assert(vesper.tokenIsExpired(t));

		d = new Date();
		d.setUTCDate(now.getUTCDate() + 1);
		t.expiration = d.toString();
		assert(!vesper.tokenIsExpired(t));

	});
});

suite('passwords', function() {

	test('validation', function() {

		var fs = require('fs');
		eval(fs.readFileSync('../../routes/resetpassword.js', 'utf8'));

		assert(validatePasswords('foo', 'foo') !== PASSWORDS_OK);
		assert(validatePasswords('f', 'foo') !== PASSWORDS_OK);
		assert(validatePasswords('f00', 'foo') !== PASSWORDS_OK);
		assert(validatePasswords(null, 'foo') !== PASSWORDS_OK);
		assert(validatePasswords('fooxjh', 'foo') !== PASSWORDS_OK);
		assert(validatePasswords('foo', null) !== PASSWORDS_OK);
		assert(validatePasswords(null, null) !== PASSWORDS_OK);
		assert(validatePasswords('', null) !== PASSWORDS_OK);
		assert(validatePasswords('foo', 'oof') !== PASSWORDS_OK);
		assert(validatePasswords('foobarbaz', 'oof') !== PASSWORDS_OK);
		assert(validatePasswords('foo', 'foobarbaz') !== PASSWORDS_OK);

		assert(validatePasswords('foobarbaz', 'foobarbaz') === PASSWORDS_OK);
	});
});
