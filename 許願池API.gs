/**
 * 許願池 API - Google Apps Script
 * 貼到試算表：擴充功能 → Apps Script → 新增 .gs 檔貼上後部署為「網路應用程式」
 * Sheet 第一列標題：id	title	note	category	link	region	status	image1	image2	image3	supportCount	createdAt
 */

/**
 * GET：讀取許願列表，回傳 JSON 給前端 WISH_LIST_URL
 */
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (!data || data.length === 0) {
    return ContentService
      .createTextOutput(JSON.stringify({ wishes: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var headers = data[0];
  var rows = data.slice(1);
  var list = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val != null && val !== "") {
        obj[headers[j]] = val;
      } else {
        obj[headers[j]] = "";
      }
    }
    list.push(obj);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ wishes: list }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST：接收顧客許願表單（JSON），寫入一筆新列到 Sheet
 * 前端送：{ "title": "", "note": "", "category": "", "link": "", "region": "" }
 */
function doPost(e) {
  try {
    var json = JSON.parse(e.postData.contents);
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

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, id: newId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
