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
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
  entry: {
    "ui": "./src/js/video.player.js"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].video.player.js"
  },
  plugins: [
    new HtmlWebpackPlugin({template: "./src/js/player/index.html"}),
    new CopyWebpackPlugin([
    	{from: "./src/js/player/style", to: "style"},
		{from: "./src/js/player/script", to: "script"}
	])
  ],
  watch: true
};
