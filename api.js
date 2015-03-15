var fs = require('fs');
var request = require('request');
var Q = require('q');
var Throttle = require('./throttle');

// throttle 600 requests in 600.000 ms
var throttle = new Throttle(600, 600000);

function buildFullUrl(endpoint, query, token) {
   if (!(endpoint && token)) {
      new Error("Please specify both endpoint and token")
   }
   return endpoint + query + "?access_token=" + token;
}

function doRequest(method, endpoint, query, token, bodyData) {
   return Q.Promise(function(resolve, reject) {
      var handleError = function(error) {
         fs.appendFile('request_log.txt', error + "\n");
         reject(error);
      }

      try {
         throttle.scheduleRequest(function() {
            request({
               url: buildFullUrl(endpoint, query, token),
               method: method,
               json: bodyData,
            }, function (error, response, body) {
               if (error) {
                  handleError(error);
               } else if (response.statusCode == 200) {
                  resolve(body);
               } else {
                  handleError(response.statusCode + ": " + body);
               }
            })
         });
      } catch (e) {
         handleError(e);
      }
   });
}

module.exports = {
   get: function(query) {
      return doRequest("GET", this.endpoint, query, this.token);
   },

   post: function(query, data) {
      return doRequest("POST", this.endpoint, query, this.token, data);
   },

   put: function(query, data) {
      return doRequest("PUT", this.endpoint, query, this.token, data);
   },

   delete: function(query) {
      return doRequest("DELETE", this.endpoint, query, this.token);
   }
}
