var config = module.exports;

config["hiveshare-datastore"] = {
    env: "node",       
    rootPath: "../",
    sources: [
        "server.js"
    ],
    tests: [
        "test/*-test.js"
    ]
};

