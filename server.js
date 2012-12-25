var _ = require("underscore");
var when = require("when");

var nano = require("nano");

var HiveShareDataModel = require("hiveshare-datamodel");
var HiveShareObject = HiveShareDataModel.HiveShareObject;
var HiveShareType = HiveShareDataModel.HiveShareType;

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

        }
      }
    }, "_design/hiveshare", function (err, body) {
      deferred.resolve();
    });

    return deferred.promise;
  },

  createObject: function (type) {

    var deferred = when.defer();

    this.db.insert({type: type ? type : "object"}, null, function (err, doc) {
      if (!err) {
        deferred.resolve(doc.id);
      } else {
        deferred.reject(err);
      }
    });

    return deferred.promise;
  },

  createType: function () {

    var deferred = when.defer();

    //create object
    this.createObject("type").then(_.bind(function (id) {
        //create type, with object parameter
        deferred.resolve(new HiveShareType(id));
      }, this), deferred.reject);

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

    this._getObjects(query).then(_.bind(function (objectDocs) {
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

  _getObjects: function (hsQuery) {

    var deferred = when.defer();

    if (hsQuery.q.object_id) {
      this.db.get(hsQuery.q.object_id, null, function (err, doc) {
        deferred.resolve([doc]);
      });
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
    var query = {
      "objectId": id
    };
    this.db.view("hiveshare", "object_types", {key: id}, function (err, body) {
      deferred.resolve(body.rows);
    });

    return deferred.promise;
  },

  getType: function (hsQuery) {

    var deferred = when.defer();

    if (hsQuery.q.type_id) {
      this.db.get(hsQuery.q.type_id, null, function (err, body) {
        if (body) {
          deferred.resolve(new HiveShareType(body._id));
        } else {
          deferred.resolve(null);
        }
      });
    }

    return deferred.promise;
  }

};
