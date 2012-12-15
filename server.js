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
        this.objectConnection = new mongodb.Collection(this.connection, 
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

    this.objectConnection.insert({}, function (err, doc) {
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

  //TODO: make a proper query object
  getObjects: function (query) {
    var deferred = when.defer();

    deferred.resolve({types: [{id: 1}]});

    return deferred.promise;
  }

};
