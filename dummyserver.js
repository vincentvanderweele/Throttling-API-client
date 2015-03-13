"use strict"

var http = require('http');
var url = require('url');
var util = require('util');

function createCampaignDatabase() {
   return {
      1: {
         id: 1,
         name: 'Campaign A',
         budget: 100,
      },
      9: {
         id: 9,
         name: 'Campaign B',
         budget: 1000,
      },
      17: {
         id: 17,
         name: 'Campaign C',
         budget: 400,
      },
      23: {
         id: 23,
         name: 'Campaign D',
         budget: 500,
      },
   };
}

var graph = {
   campaigns: createCampaignDatabase(),
   nextId: 25,

   addCampaign: function(campaign) {
      campaign.id = this.nextId;
      this.campaigns[this.nextId] = campaign;

      //console.log(Object.keys(this.campaigns).length);

      return this.nextId++;
   },

   deleteCampaign: function(id) {
      if (id in this.campaigns) {
         delete this.campaigns[id];
      } else {
         throw new Error("Campaign with id " + id + " does not exist");
      }
   },

   updateCampaign: function(id, campaign) {
      if (id in this.campaigns) {
         var campaignToUpdate = this.campaigns[id];
         for (var field in campaign) {
            if (campaign.hasOwnProperty(field)) {
               campaignToUpdate[field] = campaign[field];
            }
         }
      } else {
         throw new Error("Campaign with id " + id + " does not exist");
      }
   },
}

function ServerError(message, code) {
   Error.call(this);
   this.name = this.constructor.name;
   this.message = message;
   this.code = code;
}

http.createServer(function (request, response) {
   var body = '';
   request.on('data', function (data) {
      body += data;  // assuming no DOS attacks on this dummy
   });

   request.on('end', function () {
      try {
         if (body) {
            var campaign = JSON.parse(body);
         }

         var urlParts = url.parse(request.url, true);
         var pathParts = urlParts.pathname.split("/");

         // just some silly check to see if there is a token
         if (urlParts.query.access_token !== "12345") {
            throw new ServerError("Invalid access token", 401);
         }

         if(pathParts[1] !== "campaigns") {
            throw new ServerError("This dummy only supports campaigns!", 404);
         }

         var responseObject = {};
         switch (request.method) {
            case "GET":
               responseObject = graph.campaigns;
               break;
            case "POST":
               responseObject = graph.addCampaign(campaign);
               break;
            case "PUT":
               graph.updateCampaign(pathParts[2], campaign);
               break;
            case "DELETE":
               graph.deleteCampaign(pathParts[2]);
               break;
            default:
               throw new Error("Request method " + request.method + " is not supported.");
         }

         response.writeHead(200, {'Content-Type': 'application/json'});
         response.end(JSON.stringify(responseObject));

      } catch (e) {
         response.writeHead(e.code || 500, {'Content-Type': 'application/json'});
         response.end(JSON.stringify({ Error: e.message }));
      }
   });
}).listen(8080, '127.0.0.1');

exports.reset = function() {
   graph.campaigns = createCampaignDatabase();
   graph.nextId = 25;
}
