var gettextParser = require("gettext-parser");
var through = require('through2');
var _ = require('lodash');
var path = require('path');

function getLang(p) {
  var a = p.split(path.sep);
  return a[a.length - 2];
}

function mergeGettext(options) {
  var langs = {};

  function bufferContents(file, enc, cb) {
    if (file.isNull()) {
      cb();
      return;
    }

    var lang = getLang(file.path);

    if (!langs.hasOwnProperty(lang)) {
      langs[lang] = [];
    }

    langs[lang].push(file);

    cb();
  }

  function endStream(cb) {
    for (var lang in langs) {
      var files = langs[lang];

      if (!files.length) {
        cb();
      }

      if (files.length <= 1) {
        this.push(files[0]);
      } else {
        var clone = files[files.length - 1].clone({ contents: false });
        var parsedFiles = [];

        for (var i = 0; i < files.length; i++) {
          const o = gettextParser.po.parse(files[i].contents);
          parsedFiles.push(o);
        }

        var head = _.head(parsedFiles);
        var tail = _.tail(parsedFiles);
        var final = _.defaultsDeep(head, ...tail);

        var contents = gettextParser.po.compile(final);

        clone.contents = contents;

        this.push(clone);
      }
    }

    cb();
  }

  return through.obj(bufferContents, endStream);
};

module.exports = mergeGettext;
