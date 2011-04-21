var util = require('util');
var jerk = require('jerk');
var repl = require('repl');
var tpb = require('./tpb');
var settings = require("./settings");

var filter = /doctor|who|The Impossible Astronaut/i;

var lrepl = repl.start();
lrepl.context.util = util;
lrepl.context.jerk = jerk;
lrepl.context.filter = filter;

var bot = jerk(function (j) {
  j.watch_for(/geronimo/i, function (msg) {
    msg.say(msg.user + ": you look timelord.");
  });

  j.watch_for(/^(.*?): leave/i, function (msg) {
    if (msg.match_data[1] == irc.options.nick)
      bot.part(msg.source);
  });
}).connect(settings);
lrepl.context.bot = bot;

// dirty hack to get a reference to the irc-js object
var irc = bot.say("","foo");
lrepl.context.irc = irc;

irc.on('invite', function (msg) {
  util.debug("INVITE to " + msg.params[1] + " by " + msg.person.nick);
  bot.join(msg.params[1]);
});

var channels = [];
lrepl.context.channels = channels;

irc.on('join', function (msg) {
  if (msg.person.nick != irc.options.nick)
    return;
  channels.push(msg.params[0]);
});
irc.on('part', function (msg) {
  if (msg.person.nick != irc.options.nick)
    return;
  delete channels[channels.indexOf(msg.params[0])];
});

//tpb.removeAllListeners('debug');
//tpb.removeAllListeners('new');

tpb.on('new', function (torrent) {
  if (!filter.test(torrent.name))
    return;
  
  for (var i in channels) {
    bot.say(channels[i],
      "http://thepiratebay.org/torrent/" + torrent.id + "/ " +
      torrent.size + " | " +
      torrent.name
    );
  }
});

// vim:set ts=2 sw=2 smartindent et:

