const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

//URL Validation
const validURL = (str) => {
  try {
    new URL(string);
  } catch (_) {
    return false;
  }
  return true;
};

//Include CORS header in response with middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/*", (req, res) => {
  if (validURL(req.params[0])) {
    const queryStr =
      req.query.length > 0
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
          config: {
            url: response.config.url,
            method: response.config.method,
            headers: {
              host: response.config.headers.host,
              "user-agent": response.config.headers["user-agent"],
              "accept-language": err.config.headers["accept-language"],
            },
          },
          data: response.data,
        };
        res.json(responseData);
      })
      .catch((err) => {
        const errData = {
          name: err.name,
          message: err.message,
          config: {
            url: err.config.url,
            method: err.config.method,
            headers: {
              host: err.config.headers.host,
              "user-agent": err.config.headers["user-agent"],
              "accept-language": err.config.headers["accept-language"],
            },
          },
        };
        res.json(errData);
      });
  } else {
    res.json({
      name: "Error",
      message: "Not a valid URL",
      config: {
        url: req.url,
        method: req.method,
        headers: {
          host: req.headers.host,
          "user-agent": req.headers["user-agent"],
          "accept-language": req.headers["accept-language"],
        },
      },
    });
  }
});

app.listen(PORT, console.log(`Listening on Port ${PORT}`));
