var mongodb = require("mongodb");
module.exports = {
  start: function (cb) {
    var mongoserver = new mongodb.Server("127.0.0.1", 27017, {});
    var db_connector = new mongodb.Db("hiveshare", mongoserver, {w: 1});
    
    db_connector.open(function (err, db) {
      this.connection = db;
      cb(true);
    });
  },
  //TODO: make a proper query object
  getObjects: function (query, cb) {
    cb(null, {types: [{id: 1}]});
  }
};
