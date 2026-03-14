/**
 * 許願池 API - Google Apps Script
 * 貼到試算表：擴充功能 → Apps Script → 新增 .gs 檔貼上後部署為「網路應用程式」
 * 重要：Sheet 第一列必須是標題 id, title, note, category, link, region, status, image1, image2, image3, supportCount, createdAt
 * CMS 後台寫入：POST 時帶 action=updateBulletins|updateDepositPlans|updateItinerary 與 secret（需與下方一致）
 */
var CMS_SECRET = "esV5RWUY40etwy0";

/**
 * GET：讀取許願列表。加上 ?callback=函數名 可回傳 JSONP（避開 CORS）
 * CMS：?type=bulletins | type=deposit | type=itinerary 讀取對應工作表（公布欄／儲值方案／行程）
 */
function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  var callback = params.callback || null;
  var type = (params.type || "").toLowerCase();

  if (params.page === "admin") {
    try {
      return HtmlService.createHtmlOutputFromFile("Admin")
        .setTitle("CMS 後台")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (err) {
      return ContentService.createTextOutput(
        "請先在 Apps Script 專案左側新增「檔案」→「新增」→「HTML」，檔名設為 Admin，將您電腦中 admin.html 的完整內容貼上後儲存，再重新部署。完成後用此網址加上 ?page=admin 開啟後台，即可避免跨域導致儲存失敗。"
      ).setMimeType(ContentService.MimeType.TEXT);
    }
  }

  if (type === "bulletins") {
    return _jsonResponse(_readBulletins(), callback);
  }
  if (type === "deposit") {
    return _jsonResponse(_readDepositPlans(), callback);
  }
  if (type === "itinerary") {
    return _jsonResponse(_readItinerary(), callback);
  }

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

function _readSheetByName(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  try {
    return sheet.getDataRange().getValues();
  } catch (err) {
    return [];
  }
}

function _getOrCreateSheet(name, headerRow) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headerRow && headerRow.length) {
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    }
  }
  return sheet;
}

function _readBulletins() {
  var data = _readSheetByName("公布欄");
  if (!data || data.length < 2) return { bulletins: [] };
  var rows = data.slice(1);
  var list = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var typeVal = (r[0] != null && String(r[0]).trim() !== "") ? String(r[0]).trim() : "";
    var textVal = (r[1] != null && String(r[1]).trim() !== "") ? String(r[1]).trim() : "";
    if (textVal === "") continue;
    list.push({ type: typeVal || "info", text: textVal });
  }
  return { bulletins: list };
}

function _readDepositPlans() {
  var data = _readSheetByName("儲值方案");
  if (!data || data.length < 2) return { depositPlans: [] };
  var rows = data.slice(1);
  var list = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var amount = parseInt(r[0], 10) || 0;
    if (amount <= 0) continue;
    var bonus = (r[1] != null && r[1] !== "") ? parseInt(r[1], 10) : 0;
    var label = (r[2] != null && String(r[2]).trim() !== "") ? String(r[2]).trim() : "";
    var badge = (r[3] != null && String(r[3]).trim() !== "") ? String(r[3]).trim() : "";
    list.push({ amount: amount, bonus: bonus, label: label, badge: badge });
  }
  return { depositPlans: list };
}

function _readItinerary() {
  var data = _readSheetByName("行程");
  if (!data || data.length < 2) return { itinerary: [] };
  var headers = data[0];
  var rows = data.slice(1);
  var list = [];
  var idx = function (name) { var i = headers.indexOf(name); return i >= 0 ? i : -1; };
  var dayIdx = idx("day");
  var titleIdx = idx("title");
  var itemsIdx = idx("items");
  var tagsIdx = idx("tags");
  var imgIdx = idx("imageUrl");
  var twSIdx = idx("twStart");
  var twEIdx = idx("twEnd");
  var jpSIdx = idx("jpStart");
  var jpEIdx = idx("jpEnd");
  var countdownIdx = idx("countdownTarget");
  if (dayIdx < 0 || titleIdx < 0) return { itinerary: [] };
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var day = (r[dayIdx] != null && String(r[dayIdx]).trim() !== "") ? String(r[dayIdx]).trim() : ("Day " + (i + 1));
    var title = (r[titleIdx] != null && String(r[titleIdx]).trim() !== "") ? String(r[titleIdx]).trim() : "";
    if (title === "") continue;
    var itemsStr = (itemsIdx >= 0 && r[itemsIdx] != null && String(r[itemsIdx]).trim() !== "") ? String(r[itemsIdx]).trim() : "";
    var items = itemsStr ? itemsStr.split("|").map(function (s) { return s.trim(); }).filter(Boolean) : [];
    var tagsStr = (tagsIdx >= 0 && r[tagsIdx] != null && String(r[tagsIdx]).trim() !== "") ? String(r[tagsIdx]).trim() : "";
    var tags = tagsStr ? tagsStr.split("|").map(function (s) { return s.trim(); }).filter(Boolean) : [];
    var imageUrl = (imgIdx >= 0 && r[imgIdx] != null && String(r[imgIdx]).trim() !== "") ? String(r[imgIdx]).trim() : "";
    var twStart = (twSIdx >= 0 && r[twSIdx] != null && String(r[twSIdx]).trim() !== "") ? String(r[twSIdx]).trim() : "";
    var twEnd = (twEIdx >= 0 && r[twEIdx] != null && String(r[twEIdx]).trim() !== "") ? String(r[twEIdx]).trim() : "";
    var jpStart = (jpSIdx >= 0 && r[jpSIdx] != null && String(r[jpSIdx]).trim() !== "") ? String(r[jpSIdx]).trim() : "";
    var jpEnd = (jpEIdx >= 0 && r[jpEIdx] != null && String(r[jpEIdx]).trim() !== "") ? String(r[jpEIdx]).trim() : "";
    var countdownTarget = (countdownIdx >= 0 && r[countdownIdx] != null && String(r[countdownIdx]).trim() !== "") ? String(r[countdownIdx]).trim() : "";
    var obj = { day: day, title: title, items: items, tags: tags };
    if (imageUrl) obj.imageUrl = imageUrl;
    if (twStart) obj.twStart = twStart;
    if (twEnd) obj.twEnd = twEnd;
    if (jpStart) obj.jpStart = jpStart;
    if (jpEnd) obj.jpEnd = jpEnd;
    if (countdownTarget) obj.countdownTarget = countdownTarget;
    list.push(obj);
  }
  return { itinerary: list };
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
 * POST：可為 (1) 上傳圖片 action=uploadImage  (2) 送出許願（JSON 或 form）
 */
function doPost(e) {
  e = e || {};
  var params = e.parameter || {};

  if (params.action === "uploadImage") {
    return _handleImageUpload(e);
  }

  var json = null;
  var returnHtml = false;

  if (params.source === "form" && params.data) {
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

  // 集氣：對指定許願 +1 supportCount，寫回試算表
  if (json.action === "addSupport") {
    try {
      var wishId = String(json.wishId || "").trim();
      if (!wishId) {
        return _postResponse({ ok: false, error: "缺少許願編號" }, returnHtml);
      }
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var data = sheet.getDataRange().getValues();
      if (!data || data.length < 2) {
        return _postResponse({ ok: false, error: "找不到許願資料" }, returnHtml);
      }
      var headers = data[0];
      var idIdx = headers.indexOf("id");
      var supportCountIdx = headers.indexOf("supportCount");
      if (idIdx === -1 || supportCountIdx === -1) {
        return _postResponse({ ok: false, error: "試算表缺少 id 或 supportCount 欄位" }, returnHtml);
      }
      var targetRow = -1;
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]) === wishId) {
          targetRow = i + 1;
          break;
        }
      }
      if (targetRow === -1) {
        return _postResponse({ ok: false, error: "找不到指定編號的許願" }, returnHtml);
      }
      var current = parseInt(data[targetRow - 1][supportCountIdx], 10) || 0;
      var newCount = current + 1;
      sheet.getRange(targetRow, supportCountIdx + 1).setValue(newCount);
      return _postResponse({ ok: true, supportCount: newCount }, returnHtml);
    } catch (err) {
      return _postResponse({ ok: false, error: err.toString() }, returnHtml);
    }
  }

  // CMS 後台：驗證密碼（登入用）
  if (json.action === "verify") {
    if (json.secret === CMS_SECRET) {
      return _postResponse({ ok: true }, returnHtml);
    }
    return _postResponse({ ok: false, error: "密碼錯誤" }, returnHtml);
  }

  // CMS 後台：寫入公布欄／儲值方案／行程（需帶 secret）
  if (json.action === "updateBulletins" || json.action === "updateDepositPlans" || json.action === "updateItinerary") {
    if (json.secret !== CMS_SECRET) {
      return _postResponse({ ok: false, error: "密碼錯誤或未提供" }, returnHtml);
    }
  }
  if (json.secret === CMS_SECRET) {
    if (json.action === "updateBulletins") {
      try {
        var list = json.bulletins || [];
        var sheet = _getOrCreateSheet("公布欄", ["type", "text"]);
        sheet.clearContents();
        sheet.getRange(1, 1, 1, 2).setValues([["type", "text"]]);
        for (var i = 0; i < list.length; i++) {
          var b = list[i];
          sheet.getRange(i + 2, 1, 1, 2).setValues([[b.type || "info", b.text || ""]]);
        }
        return _postResponse({ ok: true }, returnHtml);
      } catch (err) {
        return _postResponse({ ok: false, error: err.toString() }, returnHtml);
      }
    }
    if (json.action === "updateDepositPlans") {
      try {
        var list = json.depositPlans || [];
        var sheet = _getOrCreateSheet("儲值方案", ["amount", "bonus", "label", "badge"]);
        sheet.clearContents();
        sheet.getRange(1, 1, 1, 4).setValues([["amount", "bonus", "label", "badge"]]);
        var rowNum = 2;
        for (var i = 0; i < list.length; i++) {
          var p = list[i];
          var amt = parseInt(p.amount, 10) || 0;
          if (amt <= 0) continue;
          sheet.getRange(rowNum, 1, 1, 4).setValues([[amt, parseInt(p.bonus, 10) || 0, p.label || "", p.badge || ""]]);
          rowNum++;
        }
        return _postResponse({ ok: true }, returnHtml);
      } catch (err) {
        return _postResponse({ ok: false, error: err.toString() }, returnHtml);
      }
    }
    if (json.action === "updateItinerary") {
      try {
        var list = json.itinerary || [];
        var headers = ["day", "title", "items", "tags", "imageUrl", "twStart", "twEnd", "jpStart", "jpEnd", "countdownTarget"];
        var sheet = _getOrCreateSheet("行程", headers);
        sheet.clearContents();
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        for (var i = 0; i < list.length; i++) {
          var d = list[i];
          var itemsStr = Array.isArray(d.items) ? d.items.join("|") : (d.items || "");
          var tagsStr = Array.isArray(d.tags) ? d.tags.join("|") : (d.tags || "");
          sheet.getRange(i + 2, 1, 1, headers.length).setValues([[
            d.day || "", d.title || "", itemsStr, tagsStr,
            d.imageUrl || "", d.twStart || "", d.twEnd || "", d.jpStart || "", d.jpEnd || "", d.countdownTarget || ""
          ]]);
        }
        return _postResponse({ ok: true }, returnHtml);
      } catch (err) {
        return _postResponse({ ok: false, error: err.toString() }, returnHtml);
      }
    }
  }

  // 管理員：更新單筆許願（狀態 / 圖片）
  if (json.action === "updateWish") {
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var data = sheet.getDataRange().getValues();
      if (!data || data.length < 2) {
        return _postResponse({ ok: false, error: "目前沒有資料可更新" }, returnHtml);
      }
      var headers = data[0];
      var idIndex = headers.indexOf("id");
      var statusIndex = headers.indexOf("status");
      var img1Index = headers.indexOf("image1");
      var img2Index = headers.indexOf("image2");
      var img3Index = headers.indexOf("image3");
      if (idIndex === -1) {
        return _postResponse({ ok: false, error: "找不到 id 欄位" }, returnHtml);
      }
      var targetRow = -1;
      var targetId = String(json.id || "");
      for (var i = 1; i < data.length; i++) {
        var rowId = String(data[i][idIndex]);
        if (rowId === targetId) {
          targetRow = i + 1; // 轉成試算表列號（從 1 開始）
          break;
        }
      }
      if (targetRow === -1) {
        return _postResponse({ ok: false, error: "找不到指定編號的許願" }, returnHtml);
      }
      var rowRange = sheet.getRange(targetRow, 1, 1, headers.length);
      var rowValues = rowRange.getValues()[0];
      if (statusIndex !== -1 && typeof json.status === "string" && json.status !== "") {
        rowValues[statusIndex] = json.status;
      }
      if (img1Index !== -1 && typeof json.image1 === "string" && json.image1 !== "") {
        rowValues[img1Index] = json.image1;
      }
      if (img2Index !== -1 && typeof json.image2 === "string" && json.image2 !== "") {
        rowValues[img2Index] = json.image2;
      }
      if (img3Index !== -1 && typeof json.image3 === "string" && json.image3 !== "") {
        rowValues[img3Index] = json.image3;
      }
      rowRange.setValues([rowValues]);
      return _postResponse({ ok: true, id: targetId }, returnHtml);
    } catch (err) {
      return _postResponse({ ok: false, error: err.toString() }, returnHtml);
    }
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

/**
 * 上傳圖片：接受 (1) POST body JSON { image: "data:image/...;base64,..." } 或 (2) 表單 source=form 且參數 image= dataURL
 */
function _handleImageUpload(e) {
  var dataUrl = "";
  var returnHtml = (e.parameter && e.parameter.source === "form");

  if (e.parameter && e.parameter.source === "form" && e.parameter.image) {
    dataUrl = e.parameter.image;
  } else if (e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      dataUrl = body.image || "";
    } catch (err) {
      return _uploadResponse({ ok: false, error: "格式錯誤" }, returnHtml);
    }
  }

  try {
    if (!dataUrl || dataUrl.indexOf("base64,") === -1) {
      return _uploadResponse({ ok: false, error: "圖片格式錯誤" }, returnHtml);
    }
    var base64 = dataUrl.split("base64,")[1];
    if (!base64) {
      return _uploadResponse({ ok: false, error: "圖片格式錯誤" }, returnHtml);
    }
    var mime = "image/jpeg";
    var ext = "jpg";
    if (dataUrl.indexOf("image/png") !== -1) { mime = "image/png"; ext = "png"; }
    if (dataUrl.indexOf("image/gif") !== -1) { mime = "image/gif"; ext = "gif"; }
    if (dataUrl.indexOf("image/webp") !== -1) { mime = "image/webp"; ext = "webp"; }
    var blob = Utilities.newBlob(Utilities.base64Decode(base64), mime, "wish-" + new Date().getTime() + "." + ext);
    var folder = _getOrCreateWishFolder();
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fid = file.getId();
    var url = "https://drive.google.com/thumbnail?id=" + fid + "&sz=w800";
    return _uploadResponse({ ok: true, url: url }, returnHtml);
  } catch (err) {
    return _uploadResponse({ ok: false, error: err.toString() }, returnHtml);
  }
}

function _uploadResponse(obj, asHtml) {
  if (asHtml) {
    var payload = { upload: true, ok: obj.ok, url: obj.url || "", error: obj.error || "" };
    var script = "window.parent.postMessage(" + JSON.stringify(payload) + ", '*');";
    var html = "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body><script>" + script + "<\/script><\/body><\/html>";
    return ContentService.createTextOutput(html).setMimeType(ContentService.MimeType.HTML);
  }
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function _getOrCreateWishFolder() {
  var name = "許願池圖片";
  var iter = DriveApp.getFoldersByName(name);
  if (iter.hasNext()) return iter.next();
  return DriveApp.getRootFolder().createFolder(name);
}
