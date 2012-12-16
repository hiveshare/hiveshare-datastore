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
      try {
        assert.equals(result.length, 1);
        assert.equals(result[0].id, newId);
      } finally {
        done();
      }
    });

  },

  "Can add a type to an object": function (done) {
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
        return server.addTypeToObject(newId, 1);
      },
      function () {
        return server.getObjects({"_id": newId});
      }
    ]).then(function (result) {
      try {
        assert.equals(_.values(result[0].types).length, 1);
        assert.equals(_.keys(result[0].types)[0], 1);
        assert.equals(_.values(result[0].types)[0].id, 1);
      } finally {
        done();
      }
    });
  }

});

