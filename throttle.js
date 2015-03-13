"use strict"

module.exports = function(throttleLimit, throttlePeriod) {
   var history = []; // timestamps of requests that happened within the throttle period
   var queue = [];   // requests that still need to be processed
   var maxHistory = throttleLimit; // maximum size of the history, before throttling starts
   var period = throttlePeriod;    // period for which timestamps stay in history (ms)

   // return the largest index i such that haystack[i] <= needle
   // return -1 if no such i exists
   var binarySearch = function(haystack, needle) {
      if (haystack.length == 0 || haystack[0] > needle) return -1;
      if (haystack[haystack.length - 1] <= needle) return haystack.length - 1;

      // inv: haystack[i] <= needle < haystack[j]
      var i = 0, j = haystack.length - 1;
      while (i + 1 < j) {
         var m = Math.floor((i + j) / 2);
         if (haystack[m] <= needle) i = m;
         else j = m;
      }
      return i;
   }

   var removeOldHistory = function(now) {
      // keep the part of history _after_ (now - period)
      history = history.slice(binarySearch(history, now - period) + 1, history.length);
   }

   var executeQueuedRequest = function() {
      // update request history
      var now = Date.now();
      removeOldHistory(now);
      history.push(now);

      // execute queued request
      var request = queue.shift();
      request();

      if (queue.length > 0) {
         if (history.length < maxHistory) {
            // directly execute if the history allows it
            executeQueuedRequest();
         } else {
            // set timer for next queued request
            scheduleQueuedRequest(now);
         }
      }
   }

   var scheduleQueuedRequest = function(now) {
      // schedule for the first moment that the oldest event in history is no longer blocking
      setTimeout(executeQueuedRequest, history[0] + period - now);
   }

   this.scheduleRequest = function(request) {
      // we have three cases:
      // 1) no throttling needed yet:
      //    - execute this request directly
      //    - update the request history
      // 2) the current request is the first to be throttled:
      //   - add the request to the waiting queue
      //   - set a timer to when the oldest request in history is no longer blocking
      // 3) there are already requests in the waiting queue
      //   - add this request to the queue

      if (queue.length == 0) {
         var now = Date.now();
         removeOldHistory(now);

         if (history.length < maxHistory) {
            // 1)
            history.push(now);
            request();
         } else {
            // 2)
            queue.push(request);
            scheduleQueuedRequest(now);
         }
      } else {
         // 3)
         queue.push(request);
      }
   }
};
