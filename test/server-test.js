var vows = require("vows");
var assert = require("assert");

var suite = vows.describe("server");

var server = require("../server.js");

suite.addBatch({

  "Objects": {

    "Can be queried based on type": {

      topic: function () {
        var cb = this.callback;
        server.start(function () {
          server.getObjects({type: {id: 1}}, cb);
        });
      },

      "is correct": function (result) {
        assert.deepEqual(result, {types: [{id: 1}]});
      }
    }
  }
});

suite["export"](module);
