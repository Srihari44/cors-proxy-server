const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

//URL Validation
const validURL = (str) => {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
};

//Include CORS header in response with middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/*", (req, res) => {
  if (validURL(req.params[0])) {
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
          config: {
            url: response.config.url,
            method: response.config.method,
            headers: response.config.headers,
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
                  headers: err.config.headers,
              }
          }
        res.json(errData);
      });
  } else {
    res.json({
      name: "Error",
      message: "Not a valid URL",
      config: {
        url: req.url,
        method: req.method,
      },
    });
  }
});

app.listen(PORT, console.log(`Listening on Port ${PORT}`));
