var _ = require("underscore");
var when = require("when");

var mongodb = require("mongodb");

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

  addObjectType: function (id) {
  },

  getObjects: function (request) {
    var deferred = when.defer();

    var id = request._id.toString();
    var query = {
      "_id": mongodb.ObjectID(id)
    };
    this.objectCollection.find(query, {limit: 2}).toArray(function (err, docs) {
      deferred.resolve(docs);
    });

    return deferred.promise;
  }

};
