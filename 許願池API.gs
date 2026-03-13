/**
 * 許願池 API - Google Apps Script
 * 貼到試算表：擴充功能 → Apps Script → 新增 .gs 檔貼上後部署為「網路應用程式」
 * 重要：Sheet 第一列必須是標題 id, title, note, category, link, region, status, image1, image2, image3, supportCount, createdAt
 */

/**
 * GET：讀取許願列表。加上 ?callback=函數名 可回傳 JSONP（避開 CORS）
 */
function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  var callback = params.callback || null;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = [];
  try {
    data = sheet.getDataRange().getValues();
  } catch (err) {
    data = [];
  }
  if (!data || data.length === 0) {
    return _jsonResponse({ wishes: [] }, callback);
  }
  var headers = data[0];
  var rows = data.slice(1);
  var list = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var val = row[j];
      obj[key] = (val != null && val !== "") ? val : "";
    }
    list.push(obj);
  }
  return _jsonResponse({ wishes: list }, callback);
}

function _jsonResponse(obj, callback) {
  var json = JSON.stringify(obj);
  if (callback) {
    var text = callback + "(" + json + ");";
    return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST：接收顧客許願表單（JSON），寫入一筆新列到 Sheet
 * 前端可送：(1) fetch 送 body JSON  (2) 表單 submit 送參數 source=form 與 data=JSON 字串（避開 CORS）
 */
function doPost(e) {
  var json = null;
  var returnHtml = false;

  if (e && e.parameter && e.parameter.source === "form" && e.parameter.data) {
    returnHtml = true;
    try {
      json = JSON.parse(e.parameter.data);
    } catch (err) {
      return _postResponse({ ok: false, error: "資料格式錯誤" }, returnHtml);
    }
  } else if (e && e.postData && e.postData.contents) {
    try {
      json = JSON.parse(e.postData.contents);
    } catch (err) {
      return _postResponse({ ok: false, error: err.toString() }, returnHtml);
    }
  }

  if (!json) {
    return _postResponse({ ok: false, error: "沒有收到表單資料" }, returnHtml);
  }

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = sheet.getLastRow();
    var newId = (lastRow < 1) ? 1 : lastRow;
    var now = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd HH:mm");

    var row = [
      newId,
      json.title || "",
      json.note || "",
      json.category || "其他",
      json.link || "",
      json.region || "",
      "許願中",
      json.image1 || "",
      json.image2 || "",
      json.image3 || "",
      0,
      now
    ];
    sheet.appendRow(row);

    return _postResponse({ ok: true, id: newId }, returnHtml);
  } catch (err) {
    return _postResponse({ ok: false, error: err.toString() }, returnHtml);
  }
}

function _postResponse(obj, asHtml) {
  if (asHtml) {
    var script = "window.parent.postMessage(" + JSON.stringify(obj) + ", '*');";
    var html = "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body><script>" + script + "<\/script><\/body><\/html>";
    return ContentService.createTextOutput(html).setMimeType(ContentService.MimeType.HTML);
  }
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
