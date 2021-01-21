const express = require("express");
const axios = require("axios");
const validUrl = require("valid-url");
const cheerio = require("cheerio");
const { response } = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
//Include CORS header in response with middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});
app.get("/", (req, res) => { res.render('index', { title: false, data: false, helptext: true})})
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
          headers: {
            date: response.headers.date,
            "content-type": response.headers["content-type"],
            connection: response.headers.connection,
            "x-powered-by": response.headers["x-powered-by"],
            server: response.headers.server,
          },
          config: {
            url: response.config.url,
            method: response.config.method,
          },
          data: response.data,
        };
        let CTheaders = responseData.headers["content-type"];
        if (CTheaders.startsWith("text/html")) {
          const $ = cheerio.load(responseData.data);
          $("[href]").each(function () {
            let mHref = /^https?:\/\//i.test($(this).attr("href"))
              ? req.protocol +
                "://" +
                req.get("host") +
                "/" +
                $(this).attr("href")
              : fullUrl + '/' + $(this).attr("href");
            $(this).attr("href", mHref);
          });
          $("[src]").each(function () {
            let mSrc = /^https?:\/\//i.test($(this).attr("src"))
              ? req.protocol +
                "://" +
                req.get("host") +
                "/" +
                $(this).attr("src")
              : fullUrl + "/" + $(this).attr("src");
            $(this).attr("src", mSrc);
          });
          res.send($.html());
        } else if (CTheaders.startsWith("application/json")) {
          !origin
            ? res.render("index", {
                title: "JSON Results for: " + url.replace("https://", ""),
                data: JSON.stringify(responseData, null, 2),
                helptext: ''
              })
            : res.json(responseData);
        } else {
          res.setHeader("Content-Type", CTheaders);
          if (CTheaders.startsWith('application')) {
           res.send(response.data); 
          }
          else {
            res.redirect(url)
          }
        }
      })
      .catch((err) => {
        const errData = {
          name: err.name,
          message: err.message,
        };
        !origin
          ? res.status(err.response? err.response.status : 404).render("index", {
              title:
                "Error occured while fetching: " + url.replace("https://", ""),
              data: JSON.stringify(errData, null, 2),
              helptext: "",
            })
          : res.status(err.response? err.response.status : 404).json(errData);
      });
  } else {
    const errData = {
      message: "Not a valid URL. Check Your URL",
    };

    !origin
      ? res.status(400).render("index", {
          title: "ERROR",
          data: JSON.stringify(errData, null, 2),
          helptext: "",
        })
      : res.status(400).json(errData);
  }
});

app.listen(PORT, console.log(`Listening on Port ${PORT}`));
