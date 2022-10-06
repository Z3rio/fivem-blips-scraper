const requestPromise = require("request-promise");
const request = require("request");
const fileSystem = require("fs");
const cheerio = require("cheerio");

function download(uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    request(uri)
      .pipe(fileSystem.createWriteStream(filename))
      .on("close", callback);
  });
}

requestPromise(
  "https://docs.fivem.net/docs/game-references/blips/",
  (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html);
      $(".blips:not(.blip-colors) .blip").each((idx, el) => {
        const blipId = $(el).find("strong").text();
        const imageLink = `https://docs.fivem.net${$(el)
          .find("img")
          .prop("src")}`;
        download(imageLink, `./images/${blipId}.png`, function () {
          console.log(`Successfully downloaded blip number ${blipId}`);
        });
        return;
      });
    }
  }
);
