/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

"use strict";
/*
const babel = require("@babel/core");
babel.transform("code", optionsObject);
*/

require("normalize.css/normalize.css");
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/lookandfeel.css";

import "bootstrap/dist/js/bootstrap.min.js";

import "core-js/stable";
import "regenerator-runtime/runtime";
import { saveAs } from "file-saver";
import clone from "just-clone";

// Survey Report
const SurveyReport = {
  surveyID: "",
  userID: "",
  date: {
    year: 0,
    month: 0,
    week: "",
    day: 0,
  },
  surveyValues: [],
  surveyResult: 0,
  comment: "hello world!",
};
let SurveyReports = [];

/**
 * Saves survey data to the
 *  browser's local storage
 * @since Delimiter hierarchy (highest to lowest):
 *  ";" -> ":" -> "-" or ",".
 *  "!" operator returns true if null
 *  "~" operator returns true if not -1
 *  @param {Object} data The SurveyReport object
 *   to be stored.
 * @returns {undefined}
 */
function saveData(data) {
  if (typeof window.Storage !== "undefined") {
    let flag = false;
    let key = `${data.surveyID};${data.date.year}:${data.date.month}`;
    let valueRange = `w:${data.date.week}`;
    let value = `d:${data.date.day}:${data.surveyValues.toString()}:${
      data.surveyResult
    }:${data.comment}`;
    // Debug
    // console.log("length = " + localStorage.length);
    for (let i = 0; i < localStorage.length; i++) {
      // If a key with the same ID already exists
      if (localStorage.key(i).charAt(0) === data.surveyID) {
        flag = true;
        break;
      }
    }
    let oldData = localStorage.getItem(key);
    // "!" operator returns true if null
    // New entry
    if (oldData !== null) {
      // New month
      if (flag) {
        // Save data to file system
        let fKey, fValue, blob;
        for (let i = 0; i < localStorage.length; i++) {
          fKey = localStorage.key(i);
          fValue = localStorage.getItem(fKey);
          blob = new Blob([`${fValue}`], { type: "text/plain;charset=utf-8" });
          saveAs(blob, `${fKey}.txt`);
        }
        clearLocalStorage(false);
      }
      console.log("creating save for " + data.surveyID);
      localStorage.setItem(key, `${key};${valueRange}:${value}`);
    } else {
      // "~" operator returns true if not -1
      // Existing key; week range conflict
      if (oldData.includes(valueRange)) {
        // Existing key; week range conflict; day conflict
        if (oldData.includes(`d:${data.date.day}`)) {
          localStorage.setItem(
            key,
            `${oldData.slice(
              0,
              oldData.lastIndexOf(`:d:${data.date.day}:`) + 0
            )}:${value}`
          );
        } else {
          // Existing key; week range conflict; no day conflict
          localStorage.setItem(key, `${oldData}:${value}`);
        }
      } else {
        // Existing key; no week range conflict
        localStorage.setItem(key, `${oldData};${valueRange}:${value}`);
      }
    }
    // Debug
    // clearLocalStorage();
    checkStorageSize();
  }
}

/**
 * Read data from local storage
 * @param {String} ID The table it is reading from.
 * @returns {undefined}
 */
function readDataFromStorage(ID) {
  if (ID === "") {
    if (SurveyReports.length > 0) {
      ID = SurveyReports[0].surveyID;
    }
  }
  for (let i = 0; i < localStorage.length; i++) {
    // If a key with the same ID already exists
    if (
      localStorage.key(i).charAt(0) === ID &&
      localStorage.key(i).charAt(1) === ";"
    ) {
      let storedData = localStorage.getItem(localStorage.key(i));
      // console.log(storedData);
      parseData(storedData);
      graphData(storedData.charAt(0));
      break;
    }
  }
}

/**
 * Read data from file
 * @returns {undefined}
 */
window.readDataFromFile = function readDataFromFile() {
  let fileName = document.getElementById("formFile").files[0];
  let fileReader = new FileReader();
  fileReader.onload = function (loadedFile) {
    let storedData = loadedFile.target.result;
    // Debug
    // console.log(storedData);
    parseData(storedData);
    graphData(storedData.charAt(0));
  };
  fileReader.onerror = function (loadedFile) {
    alert(
      "Failed to read file." +
        "\n" +
        "Please make sure you are inputting the correct file." +
        "\n" +
        "Example filename: D;2021_8.txt"
    );
  };
  fileReader.readAsText(fileName);
};

/**
 * Parses data
 * @since Delimiter hierarchy (highest to lowest):
 *  ";" -> ":" -> "-" or ",".
 * @param {String} storedData The string data to parse.
 * @returns {undefined}
 */
function parseData(storedData) {
  try {
    let highLevel = [],
      key = [];
    let newSurveyReport = {},
      midLevel = [];
    highLevel = storedData.split(";");
    key = highLevel[1].split(":");
    for (let x = 2; x < highLevel.length; x++) {
      midLevel = highLevel[x].split(":");
      // console.log(midLevel);
      for (let y = 2; y < midLevel.length; y += 5) {
        newSurveyReport = clone(SurveyReport);
        newSurveyReport.surveyID = highLevel[0]; // String
        newSurveyReport.date.year = +key[0]; // Integer
        newSurveyReport.date.month = +key[1]; // Integer

        newSurveyReport.date.week = midLevel[1]; // String
        newSurveyReport.date.day = +midLevel[y + 1]; // Integer
        newSurveyReport.surveyValues = midLevel[y + 2].split(","); // Integer Array
        /*
             for (let y = 0; y < newSurveyReport.surveyValues.length; y++) {
             newSurveyReport.surveyValues[y] = +newSurveyReport.surveyValues[y];
             }
             */
        newSurveyReport.surveyResult = +midLevel[y + 3]; // Integer
        newSurveyReport.comment = midLevel[y + 4]; // String
        // console.log(newSurveyReport);
        SurveyReports.push(newSurveyReport);
      }
    }
  } catch (error) {
    console.error(error);
    alert("Failed to parse file." + "\n" + error);
  }
}

/**
 * Checks the current storage size
 *  of the browser's local storage
 * @returns {undefined}
 */
function checkStorageSize() {
  var _lsTotal = 0,
    _xLen,
    _x;
  for (_x in localStorage) {
    if (!localStorage.hasOwnProperty(_x)) {
      continue;
    }
    _xLen = (localStorage[_x].length + _x.length) * 2;
    _lsTotal += _xLen;
    console.log(
      _x.substring(0, 50) + " = " + (_xLen / 1024).toFixed(2) + " KB"
    );
  }
  console.log("Total = " + (_lsTotal / 1024).toFixed(2) + " KB out of 5000 KB");
}

function loadLocalGraphs() {
  let path = location.pathname,
    page = path.slice(path.lastIndexOf("/") + 1);
  if (page === "graphs.html") {
    readDataFromStorage("D");
    readDataFromStorage("A");
  }
}

window.onload = function onloader() {
  swapElements();
  loadLocalGraphs();
};

clearLocalStorage = function clearLocalStorage(ask) {
  if (ask) {
    let confirmation = confirm(
      "Are you sure you want to erase browser storage data?"
    );
    if (confirmation === true) {
      localStorage.clear();
    }
  } else localStorage.clear();
};
