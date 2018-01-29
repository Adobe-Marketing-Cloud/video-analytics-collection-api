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

const Q = require("q/q");

const handleResponse = (httpRequest, deferredAction) => {
    if (httpRequest.readyState !== XMLHttpRequest.DONE) {
        return;
    }

    if (httpRequest.status < 200 || httpRequest.status >= 300) {
        deferredAction.reject({
            error: "Unable to fulfill request."
        });

        return;
    }

    deferredAction.resolve({
        headers: {"Location": httpRequest.getResponseHeader("Location")},
        statusCode: httpRequest.status
    });
};

const request = (requestData) => {
    const pendingRequest = Q.defer();

    try {
        const httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = () => handleResponse(httpRequest, pendingRequest);
        httpRequest.open(requestData.method, `${requestData.baseUrl}${requestData.path}`);
        httpRequest.setRequestHeader("Content-Type", "application/json");
        httpRequest.send(JSON.stringify(requestData.data));
    } catch (err) {
        request.reject({
            error: err
        });
    }

    return pendingRequest.promise;
};

module.exports = {
    request: request
}
