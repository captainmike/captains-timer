var captainsTimer = (function(w, store) {
  'use strict';

  function setCountDownTime(countDownTimeInMilliSeconds) {
    store.setItem('session-countdown-time', countDownTimeInMilliSeconds, null, '/');
  }

  function getCountDownTime() {
    return Number(store.getItem('session-countdown-time'));
  }

  var countDownStatus = {
    getStatus: function() {
      if (getCountDownTime() == 0) { return 'aborted'; }
      if (new Date() > new Date(getCountDownTime())) { return 'inProgress'; }
      return 'pending';
    }
  };

  var countDownTimer = (function() {
    var interval = null,
      sessionLengthInMilliSeconds = 0,
      countDownLengthInMilliSeconds = 0,
      onCountDownBegin,
      onCountDown,
      onCountDownEnd,
      onCountDownAbort;

    function getNewCountDownTimeInMilliSeconds() {
      return (new Date()).getTime() + (sessionLengthInMilliSeconds - countDownLengthInMilliSeconds);
    }

    return {
      initialize: function(options) {
        sessionLengthInMilliSeconds = options.sessionMinutes * 60 * 1000;
        countDownLengthInMilliSeconds = options.countDownSeconds * 1000;
        onCountDownBegin = options.onCountDownBegin || function(second) {};
        onCountDown = options.onCountDown || function(second) {};
        onCountDownEnd = options.onCountDownEnd || function() {};
        onCountDownAbort = options.onCountDownAbort || function() {};

        this.extendTimer();
      },

      start: function() {
        if (interval) { return; }
        var context = this,
          countDownLengthInSeconds = countDownLengthInMilliSeconds / 1000;

        onCountDownBegin(countDownLengthInSeconds--);
        interval = w.setInterval(function() {
          var status = countDownStatus.getStatus();

          if (status == 'aborted' || status == 'pending') {
            context.stop();
            onCountDownAbort(status);
            return;
          }

          if (countDownLengthInSeconds > 0) {
            onCountDown(countDownLengthInSeconds--);
          } else if (countDownLengthInSeconds == 0) {
            context.stop();
            onCountDownEnd();
          }
        }, 1000);
      },

      stop: function() {
        clearInterval(interval);
        interval = null;
      },

      abort: function() {
        this.stop();
        setCountDownTime(0);
      },

      extendTimer: function() {
        setCountDownTime(getNewCountDownTimeInMilliSeconds());
      }
    };
  }());

  return {
    create: function(options) {
      var timeout,
        userOnCountDownAbort = options.onCountDownAbort || function(status) {},
        milliSecondsToCountDown = function () {
          return getCountDownTime() - (new Date().getTime());
        },
        countDownTrigger = function(timeToCountDown) {
          timeout = w.setTimeout(function() {
            var status = countDownStatus.getStatus();
            if (status == 'inProgress') { countDownTimer.start(); }
            else if (status == 'pending') { countDownTrigger(milliSecondsToCountDown()); }
          }, timeToCountDown);
        };

      options.onCountDownAbort = function(status) {
        if (status == 'pending') { countDownTrigger(milliSecondsToCountDown()); }
        userOnCountDownAbort(status);
      };

      countDownTimer.initialize(options);
      countDownTrigger(milliSecondsToCountDown());

      return {
        extendTimer: function() { countDownTimer.extendTimer(); },
        abort: function() { countDownTimer.abort(); }
      };
    }
  };
}(window, docCookies));