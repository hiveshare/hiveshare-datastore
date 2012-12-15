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

  "Can be queried based on type": function (done) {
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
      
      var expected = {
        types: [{id: newId}]
      }; 
      expected = [{
        _id: newId
      }];
      //console.log(JSON.stringify(result));
      //console.log(expected);
      try {
        assert.equals(result, expected);
      } finally {
        done();
      }
    });

  }

});

