var _ = require("underscore");
var when = require("when");

var mongodb = require("mongodb");

var HiveShareDataModel = require("hiveshare-datamodel");
var HiveShareObject = HiveShareDataModel.HiveShareObject;

module.exports = {

  start: function (collectionSuffix) {

    var mongoserver = new mongodb.Server("127.0.0.1", 27017, {});
    var db_connector = new mongodb.Db("hiveshare", mongoserver, {w: 1});

    var deferred = when.defer();

    db_connector.open(_.bind(function (err, db) {

      if (!err) {

        this.connection = db;
        this.objectCollection = new mongodb.Collection(this.connection,
          "object" + (collectionSuffix ? ("_" + collectionSuffix) : ""));
        this.typeCollection = new mongodb.Collection(this.connection,
          "type" + (collectionSuffix ? ("_" + collectionSuffix) : ""));
        this.objectTypeCollection = new mongodb.Collection(this.connection,
          "object_type" + (collectionSuffix ? ("_" + collectionSuffix) : ""));
        deferred.resolve(true);

      } else {

        deferred.reject(err);

      }

    }, this));

    return deferred.promise;

  },

  createObject: function (opts) {

    var deferred = when.defer();

    this.objectCollection.insert({}, function (err, doc) {
      if (!err) {
          deferred.resolve(doc.length && doc[0]._id);
      } else {
        deferred.reject(err);
      }
    });

    return deferred.promise;
  },

  addTypeToObject: function (objectId, typeId) {

    var deferred = when.defer();

    this.objectTypeCollection.insert(
      {
        objectId: objectId,
        typeId: typeId
      },
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

  getObjects: function (request) {

    var deferred = when.defer();
    var id = request._id.toString();

    this._getObjects(id).then(_.bind(function (objectDocs) {
      var hsObjs = _.map(objectDocs, function (doc) {
        return new HiveShareObject(doc._id.toString());
      });
      when.map(hsObjs, _.bind(this._populateObjectTypes, this))
        .then(function () {
          deferred.resolve(hsObjs);
        }
      );
    }, this));

    return deferred.promise;
  },

  _getObjects: function (id) {

    var deferred = when.defer();
    var query = {
      "_id": mongodb.ObjectID(id)
    };

    this.objectCollection
      .find(query, {limit: 2})
      .toArray(function (err, docs) {
        deferred.resolve(docs);
      });

    return deferred.promise;
  },

  _populateObjectTypes: function (hsObj) {

    var deferred = when.defer();

    this._getObjectTypes(hsObj.id).then(function (types) {
      _.each(types, function (type) {
        hsObj.addType({id: type.typeId});
      });
      deferred.resolve(hsObj);
    });

    return deferred.promise;
  },

  _getObjectTypes: function (id) {

    var deferred = when.defer();

    var query = {
      "objectId": mongodb.ObjectID(id)
    };
    this.objectTypeCollection
      .find(query, {limit: 2})
      .toArray(function (err, docs) {
        deferred.resolve(docs);
      });

    return deferred.promise;
  }

};
