var _ = require("underscore");
var buster = require("buster");
var pipeline = require("when/pipeline");

var Query = require("hiveshare-datamodel").Query;

var server = require("../server.js");

buster.testCase("HiveShare Data Model", {
  "Objects": {

    "Can be added": function (done) {

      pipeline([
        function () {
          return server.start("test");
        },
        function () {
          return server.createObject();
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
          return server.createObject();
        },
        function (id) {
          newId = id.toString();
          return server.getObjects(new Query().findObjectById(newId));
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
          return server.createObject();
        },
        function (id) {
          newId = id.toString();
          return server.addTypeToObject(newId, 1);
        },
        function () {
          return server.getObjects(new Query().findObjectById(newId));
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

  },

  "Types": {

    "Can be added": function (done) {
      pipeline([
        function () {
          return server.start("test");
        },
        function () {
          return server.createType();
        }
      ]).then(function (typeObj) {
        try {
          assert(!!typeObj.id);
        } finally {
          done();
        }
      });
    },

    "Newly created types can be found": function (done) {
      var newType;
      pipeline([
        function () {
          return server.start("test");
        },
        function () {
          return server.createType();
        },
        function (typeObj) {
          newType = typeObj;
          return server.getType(new Query().findTypeById(newType.id));
        }
      ]).then(function (result) {
        try {
          assert.equals(result, newType);
        } finally {
          done();
        }
      });
    },

    "Can add a tag to a type": function (done) {
      var newId;
      pipeline([
        function () {
          return server.start("test");
        },
        function () {
          return server.createType();
        },
        function (type) {
          newId = type.id;
          return server.addTagToType(newId, 1);
        },
        function () {
          return server.getType(new Query().findTypeById(newId));
        }
      ]).then(function (result) {
        try {
          assert.equals(_.values(result.tags).length, 1);
          assert.equals(_.keys(result.tags)[0], 1);
          assert.equals(_.values(result.tags)[0].id, 1);
        } finally {
          done();
        }
      });
    }
  },

  "Tags": {
    "Can be created": function (done) {
      pipeline([
        function () {
          return server.start("test");
        },
        function () {
          return server.createTag();
        }
      ]).then(function (tagObj) {
        try {
          assert(!!tagObj.id);
        } finally {
          done();
        }
      });
    },

    "Newly created tags can be found": function (done) {
      var newTag;
      pipeline([
        function () {
          return server.start("test");
        },
        function () {
          return server.createTag();
        },
        function (tagObj) {
          newTag = tagObj;
          return server.getTag(new Query().findTagById(newTag.id));
        }
      ]).then(function (result) {
        try {
          assert.equals(result, newTag);
        } finally {
          done();
        }
      });
    }
  }

});

