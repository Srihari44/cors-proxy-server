const express = require("express");
const axios = require("axios");
const validUrl = require("valid-url");
const cheerio = require("cheerio");
const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use("/static", express.static("public"));
//Include CORS header in response with middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/*", (req, res) => {
  const origin = req.headers.origin;
  const fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  if (validUrl.isWebUri(req.params[0])) {
    const queryStr =
      Object.keys(req.query).length > 0
        ? "?" + new URLSearchParams(req.query).toString()
        : "";
    const url = req.params[0] + queryStr;
    axios
      .get(url)
      .then((response) => {
        //Customizing our Response to have only desired properties in our response
        const responseData = {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: {
            url: response.config.url,
            method: response.config.method,
          },
          data: response.data,
        };
        let headers = responseData.headers["content-type"];
        if (headers.startsWith("text/html")) {
          const $ = cheerio.load(responseData.data);
          $("[href]").each(function () {
            let mHref = /^https?:\/\//i.test($(this).attr("href"))
              ? req.protocol +
                "://" +
                req.get("host") +
                "/" +
                $(this).attr("href")
              : fullUrl + $(this).attr("href");
            $(this).attr("href", mHref);
          });
          $("[src]").each(function () {
            let mSrc = /^https?:\/\//i.test($(this).attr("src"))
              ? req.protocol +
                "://" +
                req.get("host") +
                "/" +
                $(this).attr("src")
              : fullUrl + $(this).attr("src");
            $(this).attr("src", mSrc);
          });
          res.send($.html());
        } else if (headers.startsWith("application/json")) {
          !origin
            ? res.render("index", {
                title: url.replace("https://", ""),
                data: JSON.stringify(responseData, null, 4),
              })
            : res.json(responseData);
        } else {
            res.setHeader("content-type", responseData.headers["content-type"]);
            res.send(responseData.data);
        }
      })
      .catch((err) => {
        const errData = {
          name: err.name,
          message: err.message,
        };
        !origin
          ? res.render("index", {
              title: url.replace("https://", ""),
              data: JSON.stringify(errData, null, 4),
            })
          : res.json(errData);
      });
  } else {
    const errData = {
      name: "Error",
      message: "Not a valid URL",
    };

    !origin
      ? res.render("index", {
          data: JSON.stringify(errData, null, 4),
        })
      : res.json(errData);
  }
});

app.listen(PORT, console.log(`Listening on Port ${PORT}`));
