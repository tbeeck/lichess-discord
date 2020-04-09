var assert = require('assert');
var format = require('../format-seconds');
describe('Commands', function() {
  describe('formatSeconds()', function() {
    it('should format 1 second', function() {
      assert.equal("1 second", format.formatSeconds(1));
    });
    it('should format 1 minute', function() {
      assert.equal("1 minute", format.formatSeconds(60));
    });
    it('should format 1 hour', function() {
      assert.equal("1 hour", format.formatSeconds(3600));
    });
    it('should format 1 day', function() {
      assert.equal("1 day", format.formatSeconds(86400));
    });
  });
});
