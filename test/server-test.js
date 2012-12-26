var _ = require("underscore");
var buster = require("buster");
var pipeline = require("when/pipeline");

var Query = require("hiveshare-datamodel").Query;

var server = require("../server.js");

var logError = function (done) {
  return function (err) {
    console.log(err);
    done();
  };
};

buster.testCase("HiveShare Data Model", {
  "Objects": {

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
          var types = _.keys(result[0].types);
          assert.equals(types.length, 1, "Has a type");
          assert.equals(types[0], HiveShareDataModel.DEFAULT_TYPE_ID, "Is the default type");
        } finally {
          done();
        }
      }, logError(done));

    },

    "Can add a type to an object": function (done) {

      var newObjectId, newTypeId;
      pipeline([
        function () {
          return server.start("test");
        },
        function () {
          return server.createObject();
        },
        function (objectId) {
          newObjectId = objectId;
          return server.createType();
        },
        function (type) {
          newTypeId = type.id;
          return server.addTypeToObject(newObjectId, newTypeId);
        },
        function () {
          return server.getObjects(new Query().findObjectById(newObjectId));
        }
      ]).then(function (result) {
        try {
          assert.equals(_.values(result[0].types).length, 2);
          assert.equals(_.keys(result[0].types)[1], newTypeId);
          assert.equals(_.values(result[0].types)[1].id, newTypeId);
        } finally {
          done();
        }
      }, logError(done));
    },

    "Cannot get an object which does not exist": function (done) {

      var newObjectId, newTypeId;
      pipeline([
        function () {
          return server.start("test");
        },
        function () {
          return server.getObjects(new Query().findObjectById("some id"));
        }
      ]).then(
        function (result) {
          assert(false);
          done();
        }, function (err) {
          assert(err);
          done();
        }
      );


    },

    "//Cannot add a type which does exist to an object": function () {

    },

    "Can add a tag value to an object which has the tag": function (done) {

      var newObjectId, newTypeId, newTagId;

      pipeline([
        function () {
          return server.start("test");
        },
        function () {
          return server.createObject();
        },
        function (objectId) {
          newObjectId = objectId;
          return server.createType();
        },
        function (type) {
          newTypeId = type.id;
          return server.addTypeToObject(newObjectId, newTypeId);
        },
        function () {
          return server.createTag(newTypeId);
        },
        function (tag) {
          newTagId = tag.id;
          return server.addTagToType(newTypeId, newTagId);
        },
        function () {
          return server.addTagValueToObject(newObjectId, newTagId, newTypeId,
            "tagvalue");
        },

        function () {
          return server.getObjectValue(newObjectId, newTagId, newTypeId);
        }
      ]).then(function (result) {
        try {
          assert.equals(result, "tagvalue");
        } finally {
          done();
        }
      }, logError(done));
    },

    "Cannot add a tag value to an object which does not have the tag": function (done) {

      var newObjectId, newTypeId, newTagId;

      pipeline([
        function () {
          return server.start("test");
        },
        function () {
          return server.createObject();
        },
        function (newObjectId) {
          return server.addTagValueToObject(newObjectId, "some tag id",
            "some type id", "tagvalue");
        }
      ]).then(function (result) {
        assert(false);
        done();
      }, function (err) {
        assert(err);
        done();
      });
    },

    "//Can only add tag values of the correct type": function () {

    },

    "//Can query objects by type": function () {

    },

    "//Can query objects query by tag value": function () {

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
      }, logError(done));
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
      }, logError(done));
    }
  },

  "Tags": {

    "Newly created tags can be found": function (done) {
      var newTag, type;
      pipeline([
        function () {
          return server.start("test");
        },
        function () {
          return server.createType();
        },
        function (typeObj) {
          type = typeObj;
          return server.createTag(typeObj.id);
        },
        function (tagObj) {
          newTag = tagObj;
          return server.getTag(new Query().findTagById(newTag.id, type.id));
        }
      ]).then(function (result) {
        try {
          assert.equals(result, newTag);
        } finally {
          done();
        }
      }, logError(done));
    },

    "Tags cannot be created when not part of a type": function (done) {
      var newTag;
      pipeline([
        function () {
          return server.start("test");
        },
        function () {
          return server.createTag();
        }
      ]).then(function () {

      }, function (err) {
        assert(err);
        done();
      });
    }
  }

});

