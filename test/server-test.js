var vows = require("vows");
var assert = require("assert");
var pipeline = require("when/pipeline");

var suite = vows.describe("server");

var server = require("../server.js");

suite.addBatch({

  "Objects": {

    "Can be added": {

      topic: function () {
        var cb = this.callback;
        pipeline([
          function () {
            return server.start("test"); 
          },
          function () {
            return server.createObject({});
          }
        ]).then(function (result) {
          cb(null, result);
        });
      },

      "has values": function (err, id) {
        assert(!!id);
      }

    }

  }
});

suite.addBatch({

  "Objects": {

    "Can be queried based on type": {

      topic: function () {
        var cb = this.callback;
        pipeline([
          function () {
            return server.start("test");
          },
          function () {
            return server.createObject({});
          },
          function () {
            return server.getObjects({type: {id: 1}});
          }
        ]).then(function (result) {
          cb(null, result);
        });
      },

      "is correct": function (result) {
        assert.deepEqual(result, {types: [{id: 1}]});
      }

    }

  }
});

suite["export"](module);
