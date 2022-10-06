const requestPromise = require("request-promise");
const request = require("request");
const fileSystem = require("fs");
const cheerio = require("cheerio");
const inquirer = require("inquirer");
var sizeOf = require("image-size");

function download(uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    request(uri)
      .pipe(fileSystem.createWriteStream(filename))
      .on("close", callback);
  });
}

inquirer
  .prompt([
    {
      type: "rawlist",
      name: "action",
      message: "What do you want to do?",
      choices: [
        "Generate image files",
        "Generate image files + data for zerio-dispatch",
      ],
    },
  ])
  .then(async (answers) => {
    let ConfigFile = `
Shared.Blips = {
    -- has to be in the blips folder
    -- size has to be the same as width + height`;
    await requestPromise(
      "https://docs.fivem.net/docs/game-references/blips/",
      (error, response, html) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(html);
          const blips = $(".blips:not(.blip-colors) .blip");

          const blipsLength = blips.length;
          let blipAmount = 0;

          blips.each((idx, el) => {
            const blipId = $(el).find("strong").text();
            const imageLink = `https://docs.fivem.net${$(el)
              .find("img")
              .prop("src")}`;
            const path = `./images/${blipId}.png`;

            download(imageLink, path, function () {
              console.log(`Successfully downloaded blip number ${blipId}`);
              if (
                answers.action ==
                "Generate image files + data for zerio-dispatch"
              ) {
                sizeOf(path, function (err, dimensions) {
                  ConfigFile += `
    {
        number = ${blipId},
        size = ${dimensions.width}
    },`;

                  blipAmount += 1;

                  if (blipsLength == blipAmount) {
                    console.log("Saved SharedBlips.lua file");
                    ConfigFile += "\n}";
                    fileSystem.writeFile(
                      "SharedBlips.lua",
                      ConfigFile,
                      function (err) {
                        if (err) return console.log(err);
                      }
                    );
                  }
                });
              }
            });
          });
        }
      }
    );
  });
