var _ = require("underscore");
var when = require("when");
var pipeline = require("when/pipeline");

var nano = require("nano");
var uuid = require('node-uuid');

var HiveShareDataModel = require("hiveshare-datamodel");
var HiveShareObject = HiveShareDataModel.HiveShareObject;
var HiveShareType = HiveShareDataModel.HiveShareType;
var HiveShareTag = HiveShareDataModel.HiveShareTag;

module.exports = {

  start: function (dbSuffix) {

    var deferred = when.defer();
    var couchdb = new nano("http://localhost:5984");
    var dbName = "hiveshare" +
      (dbSuffix ? ("_" + dbSuffix) : "");

    couchdb.db.list(_.bind(function (err, body) {
      var notFound = !_.find(body, function (db) {
        return db === dbName;
      });
      if (notFound) {
        couchdb.db.create(dbName, _.bind(function (err, body) {
          this._setDb(couchdb, dbName);
          this._addViews().then(deferred.resolve);
        }, this));
      } else {
        this._setDb(couchdb, dbName);
        deferred.resolve();
      }
    }, this));

    return deferred.promise;
  },

  _setDb: function (couchdb, dbName) {
    this.db = couchdb.db.use(dbName);
  },

  _addViews: function () {

    var deferred = when.defer();

    this.db.insert({
      "views": {
        "object_types": {

          "map": function (doc) {
            if (doc.type === "object_type") {
              emit(doc.object_id, doc.type_id);
            }
          }

        },

        "type_tags": {

          "map": function (doc) {
            if (doc.type === "type_tag") {
              emit(doc.type_id, doc.tag_id);
            }
          }

        },

        "object_values": {

          "map": function (doc) {
            if (doc.type === "object_value") {
              emit([doc.object_id, doc.tag_id], doc.value);
            }
          }

        }
      }
    }, "_design/hiveshare", function (err, body) {
      deferred.resolve();
    });

    return deferred.promise;
  },

  createObject: function () {

    return this.addTypeToObject(uuid.v1().replace(/\-/g, ""),
      HiveShareDataModel.DEFAULT_TYPE_ID);

  },

  createType: function () {

    var deferred = when.defer();
    var typeObject;

    when.chain(pipeline([

      _.bind(this.createObject, this),

      _.bind(function (id) {
        typeObject = new HiveShareType(id);
        return this.addTypeToObject(id, HiveShareDataModel.TYPE_TYPE_ID);
      }, this),

      function () {
        return typeObject;
      }

    ]), deferred);

    return deferred.promise;
  },

  addTypeToObject: function (objectId, typeId) {

    var deferred = when.defer();
    this.db.insert(
      {
        object_id: objectId,
        type_id: typeId,
        type: "object_type"
      },
      null,
      function (err, doc) {
        if (!err) {
          deferred.resolve(objectId, typeId);
        } else {
          deferred.reject();
        }
      }
    );

    return deferred.promise;
  },

  createTag: function () {

    var deferred = when.defer();
    var tagObject;

    when.chain(pipeline([

      _.bind(this.createObject, this),

      _.bind(function (id) {
        tagObject = new HiveShareTag(id);
        return this.addTypeToObject(id, HiveShareDataModel.TAG_TYPE_ID);
      }, this),

      function () {
        return tagObject;
      }

    ]), deferred);

    return deferred.promise;

  },

  addTagToType: function (typeId, tagId) {

    var deferred = when.defer();
    this.db.insert(
      {
        type_id: typeId,
        tag_id: tagId,
        type: "type_tag"
      },
      null,
      function (err, doc) {
        if (!err) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }
    );

    return deferred.promise;
  },

  addTagValueToObject: function (objectId, tagId, tagValue) {

    var deferred = when.defer();

    this.db.insert(
      {
        object_id: objectId,
        tag_id: tagId,
        value: tagValue,
        type: "object_value"
      },
      null,
      function (err, doc) {
        if (!err) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }
    );

    return deferred.promise;
  },

  getObjects: function (query) {

    var deferred = when.defer();

    if (query.q.object_id) {
      var hsObj = new HiveShareObject(query.q.object_id);
      this._populateObjectTypes(hsObj)
          .then(
            function () {
              deferred.resolve([hsObj]);
            },
            deferred.reject
          );
    }

    return deferred.promise;
  },

  _populateObjectTypes: function (hsObj) {

    var deferred = when.defer();

    this._getObjectTypes(hsObj.id).then(function (objTypes) {
      _.each(objTypes, function (objType) {
        hsObj.addType(new HiveShareType(objType.value));
      });
      deferred.resolve(hsObj);
    });

    return deferred.promise;
  },

  _getObjectTypes: function (id) {

    var deferred = when.defer();

    this.db.view("hiveshare", "object_types", {key: id}, function (err, body) {
      deferred.resolve(body.rows);
    });

    return deferred.promise;
  },

  getObjectValue: function (objectId, tagId) {

    var deferred = when.defer();

    this.db.view("hiveshare", "object_values", {key: [objectId, tagId]},
      function (err, body) {
        deferred.resolve(body.rows[0].value);
      }
    );

    return deferred.promise;
  },

  getType: function (hsQuery) {

    var deferred = when.defer();

    if (hsQuery.q.type_id) {

      var type = new HiveShareType(hsQuery.q.type_id);
      when.chain(this._populateTypeTags(type), deferred);

    }

    return deferred.promise;
  },

   _populateTypeTags: function (hsType) {

    var deferred = when.defer();

    this._getTypeTags(hsType.id).then(function (tags) {
      _.each(tags, function (tag) {
        hsType.addTag(new HiveShareTag(tag.value));
      });
      deferred.resolve(hsType);
    });

    return deferred.promise;
  },

  _getTypeTags: function (id) {
    var deferred = when.defer();
    var query = {
      "typeId": id
    };
    this.db.view("hiveshare", "type_tags", {key: id}, function (err, body) {
      deferred.resolve(body.rows);
    });

    return deferred.promise;
  },

  getTag: function (hsQuery) {

    var deferred = when.defer();

    if (hsQuery.q.tag_id) {

      var tag = new HiveShareTag(hsQuery.q.tag_id);
      deferred.resolve(tag);

    }

    return deferred.promise;

  }

};
