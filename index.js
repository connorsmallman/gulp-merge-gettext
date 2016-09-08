var gettextParser = require("gettext-parser");
var through = require('through2');

function getLang(p) {
  var a = p.split('/');
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
        var joinedFile = files[files.length - 1].clone({ contents: false });
        var parsedContents = gettextParser.po.parse(Buffer.concat(files.map(f => new Buffer(f.contents))));

        joinedFile.contents = gettextParser.po.compile(parsedContents);

        this.push(joinedFile);
      }
    }

    cb();
  }

  return through.obj(bufferContents, endStream);
};

module.exports = mergeGettext;
