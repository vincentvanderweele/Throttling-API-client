"use strict"

var assert = require("assert");
var dummyserver = require("../dummyserver");

// all these tests assume that dummyserver is running at localhost:8080
describe('API', function() {
   var api;
   beforeEach(function() {
      // get a fresh api object each time, to have predictable throttling behavior
      api = require("../api");
      api.endpoint = 'http://localhost:8080';
      api.token = '12345';

      // reset the server database, to have predictable behavior
      dummyserver.reset();
   });

   describe('get', function() {
      it('should return the default objects in the database', function(done) {
         api.get('/campaigns').then(function(results) {
            var campaigns = JSON.parse(results);
            assert.equal(4, Object.keys(campaigns).length);
            done();
         });
      });

      it('should return an error when the token is incorrect', function(done) {
         api.token = 'wrong token';
         api.get('/campaigns').fail(function(error) {
            assert(error.indexOf("Invalid access token") > -1, error);
            done();
         });
      })
   });

   describe('post', function() {
      it('should add an object to the database', function(done) {
         var campaign = { name: "Added", budget: 2000 };
         var newId;
         api.post('/campaigns', campaign).then(function(results) {
            newId = results;
         }).then(function() {
            return api.get('/campaigns');
         }).then(function(results) {
            var campaigns = JSON.parse(results);
            var newCampaign = campaigns[newId];
            assert.equal(campaign.name, newCampaign.name);
            assert.equal(campaign.budget, newCampaign.budget);
            done();
         });
      });
   });

   describe('put', function() {
      it('should update an existing object in the database', function(done) {
         var id;
         var oldCampaign;
         var expected = { name: "newName", budget: 1234 };
         api.get('/campaigns').then(function(results) {
            var campaigns = JSON.parse(results);
            id = Object.keys(campaigns)[0];
            oldCampaign = campaigns[id];
         }).then(function() {
            return api.put('/campaigns/' + id, expected);
         }).then(function() {
            return api.get('/campaigns');
         }).then(function(results) {
            var campaigns = JSON.parse(results);
            var actual = campaigns[id];

            assert.equal(expected.name, actual.name);
            assert.equal(expected.budget, actual.budget);
            done();
         });
      });
   });

   describe('delete', function() {
      it('should remove an object from the database', function(done) {
         var id;
         api.get('/campaigns').then(function(results) {
            var campaigns = JSON.parse(results);
            id = Object.keys(campaigns)[0];
         }).then(function() {
            return api.delete('/campaigns/' + id);
         }).then(function() {
            return api.get('/campaigns');
         }).then(function(results) {
            var campaigns = JSON.parse(results);

            assert.equal(3, Object.keys(campaigns).length);
            assert.strictEqual(undefined, campaigns[id]);

            done();
         });
      });
   });
});
