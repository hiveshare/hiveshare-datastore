var _ = require("underscore");
var buster = require("buster");
var pipeline = require("when/pipeline");

var server = require("../server.js");

buster.testCase("Objects", {

  "Can be added": function (done) {
    pipeline([
      function () {
        return server.start("test"); 
      },
      function () {
        return server.createObject({});
      }
    ]).then(function (id) {
      assert(!!id);
      done();
    });
  },

  "Newly created objects can be found": function (done) {
    var newId;
    pipeline([
      function () {
        return server.start("test");
      },
      function () {
        return server.createObject({});
      },
      function (id) {
        newId = id;
        return server.getObjects({"_id": newId});
      }
    ]).then(function (result) {
      expected = [{
        _id: newId
      }];
      try {
        assert.equals(result, expected);
      } finally {
        done();
      }
    });

  }

});

