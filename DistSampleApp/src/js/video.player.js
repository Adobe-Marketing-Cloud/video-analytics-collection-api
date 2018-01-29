/*
 * ADOBE SYSTEMS INCORPORATED
 * Copyright 2017 Adobe Systems Incorporated
 * All Rights Reserved.

 * NOTICE:  Adobe permits you to use, modify, and distribute this file in accordance with the
 * terms of the Adobe license agreement accompanying it.  If you have received this file from a
 * source other than Adobe, then your use, modification, or distribution of it requires the prior
 * written permission of Adobe.
 */
const apiClient = require("./api-http-browser");
const config = require("./api-collector-config");
const SESSION_ID_EXTRACTOR = /^\/api\/(.*)\/(.*)/;

var i = 0;

(function() {
    'use strict';

    var EventType = {
        SESSION_START: 'sessionStart',
        PLAY: 'play',
        PING: 'ping',
        CONTENT_COMPLETE: 'contentComplete',
        PAUSE: 'pauseStart',
        BUFFER: 'bufferStart',
        AD_BREAK_START: 'adBreakStart',
        AD_BREAK_COMPLETE: 'adBreakComplete',
        AD_START: 'adStart',
        AD_COMPLETE: 'adComplete'
    };

    var PING_INTERVAL_MS = 10000;
    var MONITOR_TIMER_INTERVAL = 500;

    // This sample VideoPlayer simulates a mid-roll with 2 ads at time 15:
    var AD_POD_START_POS = 15;
    var AD_POD_END_POS = 30;
    var AD_ONE_START_POS = 15;
    var AD_ONE_COMPLETE_POS = 25;
    var AD_TWO_START_POS = 25;
    var AD_TWO_COMPLETE_POS = 30;
    var AD_POD_LENGTH = 15;

    function VideoPlayer(id) {

        // Configuration constants
        this.eventData = {};
        this._params = {};
        
        // mandatory params
        Object.assign(this._params, config.MANDATORY_PARAMS.VideoData);

        // optional params
        Object.assign(this._params, config.OPTIONAL_PARAMS.VideoData);
        Object.assign(this._params, config.OPTIONAL_PARAMS.VideoStandardMetadata);
        
        this._videoLoaded = false;

        this._clock = null;

        this.$el = $('#' + id);

        var self = this;
        if (this.$el) {
            this.$el.on('play', function() {
                self._onPlay();
            });
            this.$el.on('pause', function() {
                self._onPause();
            });
            this.$el.on('ended', function() {
                self._onComplete();
            });
            this.$el.on('waiting', function() {
                self._onWaiting();
            });

            this.$el.on('playing', function() {
                self._onPlaying(); 
            });
        }

        this._pendingEvents = [];
        this._sessionStarted = false;

        this._adBreakInfo = null;
        this._adInfo1 = null;
        this._adInfo2 = null;
    }

    VideoPlayer.prototype.getDuration = function() {
        return this.$el.get(0).duration - AD_POD_LENGTH;
    };

    VideoPlayer.prototype.getPlayhead = function() {
        return this.$el.get(0).currentTime;
    };

    VideoPlayer.prototype.getPlayerTime = function() {
        return {
            playhead: this.getCurrentPlaybackTime(),
            ts: this.getCurrentTimestamp()
        };
    };

    VideoPlayer.prototype.getCurrentPlaybackTime = function() {
        var playhead;
        if (this._adBreakInfo) { // During ad playback the main video playhead remains
            // constant at where it was when the ad started
            playhead = AD_POD_START_POS;
        } else {
            var vTime = this.getPlayhead();
            playhead = (vTime < AD_POD_START_POS) ? vTime : vTime - AD_POD_LENGTH;
        }
        return playhead;
    };

    VideoPlayer.prototype.getCurrentTimestamp = function () {
        return new Date().getTime();
    };

    VideoPlayer.prototype._onPlay = function() {
        this._openVideoIfNecessary();
    };

    VideoPlayer.prototype._onPlaying = function() {
        this.collectEvent(EventType.PLAY);
    };

    VideoPlayer.prototype._onWaiting = function() {
        this.collectEvent(EventType.BUFFER);
    };

    VideoPlayer.prototype._onPause = function() {
        this.collectEvent(EventType.PAUSE);
    };

    VideoPlayer.prototype._onComplete = function() {
        this._completeVideo();
    };

    VideoPlayer.prototype._openVideoIfNecessary = function() {
        if (!this._videoLoaded) {
            this._resetInternalState();
            this._startVideo();

            // Start the monitor timer.
            this._clock = setInterval(() => this._onTick(), MONITOR_TIMER_INTERVAL);
        }
    };

    VideoPlayer.prototype._completeVideo = function() {
        if (this._videoLoaded) {
            
            this.collectEvent(EventType.CONTENT_COMPLETE);
            this._unloadVideo();
        }
    };

    VideoPlayer.prototype._unloadVideo = function() {
        clearInterval(this._clock);
        clearInterval(this._hbTimer);

        this._resetInternalState();
        this._sessionStarted = false;

        console.log('Video Unloaded. API Collector reset.');
    };

    VideoPlayer.prototype._resetInternalState = function() {
        this._videoLoaded = false;
        this._clock = null;
    };

    VideoPlayer.prototype._startVideo = function() {
        this._params["media.length"] = this.getDuration();

        this.eventData.playerTime = this.getPlayerTime();
        this.eventData.eventType = EventType.SESSION_START;

        this.eventData.params = this._params;
        this.eventData.customMetadata = config.OPTIONAL_PARAMS.VideoCustomMetadata;

        this._videoLoaded = true;

        this._startSession(this.eventData);

        this._hbTimer = setInterval(() => this._sendPing(), PING_INTERVAL_MS);
    };

    VideoPlayer.prototype._startSession = function(sessionData) {
        console.log("[Player] Start session");
        console.log(sessionData);

        apiClient.request({
            "baseUrl": config.apiBaseUrl,
            "path": config.apiSessionsPath,
            "method": "POST",
            "data": sessionData
        }).then((response) => {
            const [, apiVersion, sessionId] = response.headers.Location.match(SESSION_ID_EXTRACTOR);
            this.sessionId = sessionId;
            this._sessionStarted = true;

            this._processPendingEvents();
        }).catch((error) => {
            console.log(error);
        });
    };

    VideoPlayer.prototype._processPendingEvents = function() {
        this._pendingEvents.forEach((eventData) => {
            this._collectEvent(eventData);
        });

        this._pendingEvents = [];
    };

    VideoPlayer.prototype._collectEvent = function(eventData) {
        if (!this._sessionStarted) {
            console.log("[Player] Queueing event ");
            this._pendingEvents.push(eventData);
            return;
        }

        console.log('[Player] Collect event');
        console.log(eventData);

        apiClient.request({
            "baseUrl": config.apiBaseUrl,
            "path": `${config.apiEventsPath}/${this.sessionId}/events`,
            "method": "POST",
            "data": eventData
        }).then((response) => {
            
        }).catch((error) => {
            console.log(error);
        });
    };

    VideoPlayer.prototype._startAdBreak = function() {
        this._adBreakInfo = {};
        this._adBreakInfo["media.ad.podFriendlyName"] = "Mid-roll";
        this._adBreakInfo["media.ad.podIndex"] = 1;
        this._adBreakInfo["media.ad.podSecond"] = AD_POD_START_POS;

        this.collectEvent(EventType.AD_BREAK_START, this._adBreakInfo);
    };

    VideoPlayer.prototype._completeAdBreak = function () {
        this.collectEvent(EventType.AD_BREAK_COMPLETE);
        this._adBreakInfo = null;
    };

    VideoPlayer.prototype._startFirstAd = function () {
        this._adInfo1 = {};
        this._adInfo1["media.ad.id"] = "001";
        this._adInfo1["media.ad.name"] = "Sample ad 1";
        this._adInfo1["media.ad.length"] = AD_ONE_COMPLETE_POS - AD_ONE_START_POS;
        this._adInfo1["media.ad.podPosition"] = 1;
        this._adInfo1["media.ad.playerName"] = "Sample player";

        Object.assign(this._adInfo1, config.OPTIONAL_PARAMS.AdStandardMetadata);

        this.collectEvent(EventType.AD_START, this._adInfo1, config.OPTIONAL_PARAMS.AdCustomMetadata);
    };

    VideoPlayer.prototype._startSecondAd = function () {
        this._adInfo2 = {};
        this._adInfo2["media.ad.id"] = "002";
        this._adInfo2["media.ad.name"] = "Sample ad 2";
        this._adInfo2["media.ad.length"] = AD_TWO_COMPLETE_POS - AD_TWO_START_POS;
        this._adInfo2["media.ad.podPosition"] = 2;
        this._adInfo2["media.ad.playerName"] = "Sample player";

        Object.assign(this._adInfo2, config.OPTIONAL_PARAMS.AdStandardMetadata);

        this.collectEvent(EventType.AD_START, this._adInfo2, config.OPTIONAL_PARAMS.AdCustomMetadata);
    };

    VideoPlayer.prototype._completeFirstAd = function () {
        this.collectEvent(EventType.AD_COMPLETE);
        this._adInfo1 = null;
    };

    VideoPlayer.prototype._completeSecondAd = function () {
        this.collectEvent(EventType.AD_COMPLETE);
        this._adInfo2 = null;
    };

    VideoPlayer.prototype._onTick = function() {
        if (this.$el.get(0).seeking || this.$el.get(0).paused) {
            return;
        }

        var vTime = this.getPlayhead();

        // If we're inside ad break content:
        if (vTime >= AD_POD_START_POS && vTime < AD_POD_END_POS) {
            // If we're inside the first ad
            if (vTime < AD_ONE_COMPLETE_POS) {
                if (!this._adBreakInfo) {
                    this._startAdBreak();
                }
                if (!this._adInfo1) {
                    this._startFirstAd();
                }
            } else {
                //If we're inside second ad
                if (this._adInfo1) {
                    this._completeFirstAd();
                    this._startSecondAd();
                }
            }
        } else {
            //Otherwise, we're outside ad break
            if (this._adInfo2) {
                this._completeSecondAd();
            }
            if (this._adBreakInfo) {
                //complete last ad in break and break itself
                this._completeAdBreak();
            }
        }
    };

    VideoPlayer.prototype._sendPing = function() {
        this.collectEvent(EventType.PING);
    };

    VideoPlayer.prototype.collectEvent = function (eventType, eventParams, customMetadata) {
        
        if (typeof eventParams === 'undefined'){
            eventParams = {};
        }

        var event = {
            eventType: eventType,
            playerTime: this.getPlayerTime(),
            params: eventParams
        };
        if (customMetadata) {
            event.customMetadata = customMetadata;
        }

        this._collectEvent(event);
    };

    // Export symbols.
    window.VideoPlayer = VideoPlayer;

    window.addEventListener('load', () => {
        new VideoPlayer('movie');
    });
})();
