/* ADOBE CONFIDENTIAL
 * ___________________

 * Copyright 2017 Adobe Systems Incorporated
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
*/

"use strict";

module.exports = {
    apiBaseUrl: "API_BETA_END_POINT",
    apiSessionsPath: "/api/v1/sessions",
    apiEventsPath: "/api/v1/sessions",
    MANDATORY_PARAMS: {
        VideoData: {
            "visitor.marketingCloudOrgId": "YOUR_MARKETING_ORG_ID",
            "analytics.visitorId": "YOUR_CUSTOM_VISITOR_ID_IF_ANY",
            "analytics.reportSuite": "YOUR_ADOBE_ANALYTICS_REPORT_SUITE",
            "analytics.trackingServer": "YOUR_ADOBE_ANALYTICS_TRACKING_SERVER",
            "media.id": "MEDIA_ID",
            "media.length": undefined,
            "media.playerName": "PLAYER_NAME",
            "media.contentType": "VOD",
            "media.channel": "sample-channel"
        }
    },
    OPTIONAL_PARAMS: {
        VideoData: {
            "media.name": "MEDIA_FRIENDLY_NAME",
            "media.sdkVersion": "va-api-0.0.0",
            "analytics.enableSSL": false,
            "appInstallationId": "APP_ID_DIFFERENT_FOR_EVERY_INSTANCE"
        },
        VideoStandardMetadata: {
            "media.show": "test-value",
            "media.season": "test-value",
            "media.episode": "test-value",
            "media.assetId": "test-value",
            "media.genre": "test-value",
            "media.firstAirDate": "test-value",
            "media.firstDigitalDate": "test-value",
            "media.rating": "test-value",
            "media.originator": "test-value",
            "media.network": "test-value",
            "media.showType": "test-value",
            "media.adLoad": "test-value",
            "media.pass.mvpd": "test-value",
            "media.pass.auth": "test-value",
            "media.dayPart": "test-value",
            "media.feed": "test-value",
            "media.streamFormat": "test-value"
        },
        AdStandardMetadata: {
            "media.ad.advertiser": "test-value",
            "media.ad.campaignId": "test-value",
            "media.ad.creativeId": "test-value",
            "media.ad.siteId": "test-value",
            "media.ad.creativeURL": "test-value",
            "media.ad.placementId": "test-value"
        },
        VideoCustomMetadata: {
            "VideoCustomMetadata1": "CUSTOM_VALUE1",
            "VideoCustomMetadata2": "CUSTOM_VALUE2"
        },
        AdCustomMetadata: {
            "AdCustomMetadata1": "CUSTOM_VALUE1",
            "AdCustomMetadata2": "CUSTOM_VALUE2"
        }
    }
};
