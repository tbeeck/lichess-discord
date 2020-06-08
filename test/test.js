var assert = require('assert');
var format = require('../format-seconds');
describe('Commands', function() {
  describe('formatSeconds()', function() {
    it('should format 1 minute', function() {
      assert.equal("1 minute", format.formatSeconds(60));
    });
    it('should format 2 minutes', function() {
      assert.equal("2 minutes", format.formatSeconds(120));
    });
    it('should format 1 hour', function() {
      assert.equal("1 hour", format.formatSeconds(3600));
    });
    it('should format 2 hours', function() {
      assert.equal("2 hours", format.formatSeconds(7200));
    });
    it('should format 1 day', function() {
      assert.equal("1 day", format.formatSeconds(86400));
    });
    it('should format 2 days', function() {
      assert.equal("2 days", format.formatSeconds(172800));
    });
    it('should format 1 day, 1 hour, 1 minute', function() {
      assert.equal("1 day, 1 hour, 1 minute", format.formatSeconds(90061));
    });
  });
});
