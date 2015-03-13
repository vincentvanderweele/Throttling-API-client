"use strict"

var assert = require("assert");
var Throttle = require("../throttle");

describe('Throttle', function() {
   // empirically determined constant of how long it might take to schedule a function
   // with setTimeout, within the scope of these tests
   var TIMEOUT_OVERHEAD = 40;

   describe('scheduleRequest', function() {
      it('should run a request directly when the throttle limit is not reached', function(done) {
         var limit = 3;
         var period = 100;

         var throttle = new Throttle(limit, period);

         var before = Date.now();
         throttle.scheduleRequest(function() {
            // in general, we cannot guarantee exact equals, but 5 ms precision should
            // typically be sufficient for such a simple test
            var now = Date.now();
            assert(now - before < 5, "now: " + now + "; before: " + before);
            done();
         });
      });

      it('should run a request later if the throttle limit is reached', function(done) {
         var limit = 3;
         var period = 100;

         var throttle = new Throttle(limit, period);

         var before = Date.now();
         for (var i = 0; i < limit; i++) {
            throttle.scheduleRequest(function(){});
         }

         throttle.scheduleRequest(function() {
            var now = Date.now();
            var scheduled = before + period;
            assert(scheduled <= now && now < scheduled + TIMEOUT_OVERHEAD, "now: " + now + "; scheduled: " + scheduled);
            done();
         });
      });

      it('should run consecutive requests later if the throttle limit is reached,'
       + ' also if the waiting queue spans multiple periods', function(done) {
         var limit = 3;
         var period = 100;

         var throttle = new Throttle(limit, period);

         // first block of requests (executed directly)
         var before = [];
         for (var i = 0; i < limit; i++) {
            before[i] = Date.now();
            throttle.scheduleRequest(function(){});
         }

         // second block of requests (executed roughly after *period*)
         var middle = [];
         for (var i = 0; i < limit; i++) {
            throttle.scheduleRequest(function(j) {
               return function() {
                  var now = Date.now();
                  middle[j] = now;
                  var scheduled = before[j] + period;
                  assert(scheduled <= now && now < scheduled + TIMEOUT_OVERHEAD,
                         "request: " + j + "; now: " + now + "; scheduled: " + scheduled);
               }
            }(i));
         }

         // third block of requests (executed roughly after 2 *period*)
         var counter = 0;
         for (var i = 0; i < limit; i++) {
            throttle.scheduleRequest(function(j) {
               return function() {
                  var now = Date.now();
                  var scheduled = middle[j] + period;
                  assert(scheduled <= now && now < scheduled + TIMEOUT_OVERHEAD,
                         "request: " + j + "; now: " + now + "; scheduled: " + scheduled);

                  if (++counter == limit) {
                     done();
                  }
               }
            }(i));
         }
      });

      it('should run all requests in order of arrival', function(done) {
         this.timeout(20000);

         var limit = 3;
         var period = 100;

         var throttle = new Throttle(limit, period);

         var count = 10;

         var expected = [];
         for (var i = 0; i <= count; i++) {
            expected.push(i);
         }
         var actual = [];

         var schedule = function(i) {
            // schedule with some timeout between 0 and 200 ms
            var timeout = Math.floor(200 * Math.random());
            setTimeout(function() {
               throttle.scheduleRequest(function(j) {
                  return function() {
                     actual.push(j);

                     if (j == count) {
                        assert.deepEqual(expected, actual);
                        done();
                     }
                  }
               }(i));

               if (i < count) {
                  schedule(i + 1);
               }
            }, timeout);
         }

         schedule(0);
      });
   });
});
