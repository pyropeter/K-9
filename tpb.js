var util = require("util");
var http = require("http");

module.exports = new (require('events').EventEmitter);

module.exports.on('new', function (torrent) {
  util.log("[TPB] New " + torrent.id + ": " + torrent.size +
    " | " + torrent.name);
});
module.exports.on('debug', function (msg) {
  util.log("[TPB] Debug: " + msg);
});

var requestOptions = {
  host: "thepiratebay.org",
  port: 80,
  path: "/recent",
  method: 'GET'
};
var torrentRegex = /href="\/torrent\/([^\/]+).*?">(.*?)<\/a>.*?Size (.*?),/g;
var lastId = 0;

function debugEvents (emitter, events) {
  for (var i in events) {
    var eventname = events[i];
    emitter.on(eventname, function () {
      util.debug("event: " + eventname);
    });
  }
};

function poll () {
  var req = http.request(requestOptions, function (res) {
    res.setEncoding("utf8");
    if (res.statusCode != 200) {
      module.exports.emit('debug', "non-200 response: " + res.statusCode);
      res.destroy();
      setTimeout(poll, 60000);
      return;
    }

    var body = "";
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function () {
      body = body.replace(/[\n\r\u2028\u2029]+/g, "");
      var match;
      var newLastId = 0;
      while (match = torrentRegex.exec(body)) {
        var torrentId = parseInt(match[1]);
        //module.exports.emit('debug', "torrentId: " + torrentId);
        if (torrentId <= lastId)
          continue;
        if (torrentId > newLastId)
          newLastId = torrentId;
        
        //if (lastId)
          module.exports.emit('new', {
            id: torrentId,
            name: match[2],
            size: match[3].replace("&nbsp;", " ")
          });
      }
      if (newLastId)
        lastId = newLastId;
      //module.exports.emit('debug', "DBG lastId: " + lastId);
      setTimeout(poll, 30000);
    });
  });
  req.once('error', function (e) {
    setTimeout(poll, 500);
  });
  req.on('error', function (e) {
    module.exports.emit('debug', "Error: " + e.message);
  });
  req.end();
  setTimeout(function () {
    try {
      req.destroy();
      req.emit('error', {message: "Timeout"});
      module.exports.emit('debug', "Timeout");
    } catch (e) {}
  }, 5000);
};

poll();

// vim:set ts=2 sw=2 smartindent et:
