# 用 GAS 開 CMS 後台（一步步做）

照下面做，就可以用「GAS 網址」開後台，儲存時才會正常寫入試算表。

---

## 第一步：打開 Apps Script 專案

1. 打開你的 **許願池試算表**（有許願列表的那本 Google 試算表）。
2. 上方選單點 **擴充功能** → **Apps Script**。
3. 會開一個新分頁，左邊是檔案列表（例如 `許願池API.gs`），右邊是程式碼。這就是「同一個 GAS 專案」。

---

## 第二步：新增一個 HTML 檔案

1. 在 **Apps Script 那個分頁** 左邊，找到 **「+」** 按鈕（在「檔案」旁邊）。
2. 點 **「+」** → 選 **HTML**（不要選「指令碼」）。
3. 會出現一個新檔案，檔名可能是 `Untitled` 或 `Html1`。
4. 在左邊檔案列表裡 **點一下這個新檔案**，上方會出現檔名，把檔名改成 **`Admin`**（大寫 A，其餘小寫），按 Enter 儲存。

---

## 第三步：把 admin.html 的內容貼進 Admin

1. 回到你**電腦**，用記事本或 VS Code 打開專案資料夾裡的 **admin.html**。
2. 在 admin.html 裡按 **Ctrl+A**（全選）→ **Ctrl+C**（複製）。
3. 回到 **Apps Script 分頁**，點左邊的 **Admin**，右邊會是空的或有一點預設 HTML。
4. 在右邊編輯區按 **Ctrl+A**（全選）→ **Ctrl+V**（貼上），把剛剛複製的 admin.html **整份**貼上去。
5. 按 **Ctrl+S** 或上方 **儲存** 圖示存檔。

---

## 第四步：確認 GAS 有「用 ?page=admin 開後台」的程式

1. 在左邊點 **許願池API.gs**，右邊會顯示程式碼。
2. 在程式碼**最上面**的 `doGet` 裡，要有類似下面這段（若你之前有照說明更新過，通常已經有了）：

```javascript
if (params.page === "admin") {
  try {
    return HtmlService.createHtmlOutputFromFile("Admin")
      .setTitle("CMS 後台")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return ContentService.createTextOutput(
      "請先在 Apps Script 專案左側新增「檔案」→「新增」→「HTML」，檔名設為 Admin..."
    ).setMimeType(ContentService.MimeType.TEXT);
  }
}
```

3. 若**沒有**這段，代表 許願池API.gs 還沒加「用 GAS 開後台」的程式，需要把目前專案裡的 許願池API.gs 更新成有這段的那一版。

---

## 第五步：部署（或重新部署）

1. 在 Apps Script 分頁上方點 **部署** → **新增部署**（若從沒部署過）或 **管理部署**（若已經部署過）。
2. **若是「新增部署」**：  
   - 類型選 **網路應用程式**。  
   - 說明可填「CMS 後台」或留空。  
   - 執行身分選 **我**。  
   - 存取權選 **任何人**。  
   - 按 **部署**，會跳出要授權，照畫面完成授權。
3. **若是「管理部署」**：  
   - 在現有部署右邊點 **鉛筆**（編輯）。  
   - 版本選 **新版本**（不要選「標頭」）。  
   - 按 **部署**。
4. 畫面上會出現 **網路應用程式的網址**，長得像：  
   `https://script.google.com/macros/s/一串英文數字/exec`  
5. 把這串網址 **複製起來**（整段都要）。

---

## 第六步：用瀏覽器「用 GAS 開後台」

1. 開一個**新分頁**，網址列貼上你剛複製的 GAS 網址。
2. 在網址**最後面**加上 **`?page=admin`**（問號和 page=admin 都要）。  
   - 正確範例：`https://script.google.com/macros/s/一串英文數字/exec?page=admin`  
   - 若網址最後已有 `?xxx`，改成 `&page=admin`。
3. 按 **Enter** 開啟。
4. 若成功，會看到 **CMS 後台登入** 的畫面；**GAS 部署網址**那格通常會自動帶入，你只要輸入**後台密碼**（和 許願池API.gs 裡的 `CMS_SECRET` 一樣），按 **登入** 即可。

---

## 常見狀況

| 狀況 | 怎麼做 |
|------|--------|
| 開 `網址?page=admin` 只出現一段文字，說要新增 Admin | 代表 GAS 裡還沒有名為 **Admin** 的 HTML 檔，或檔名不是 exactly `Admin`。回到第二步、第三步，確認檔名是 **Admin** 並貼上 admin.html 全文後，再重新部署一次。 |
| 登入後按儲存仍沒寫入 | 確認是從 **GAS 網址?page=admin** 開的（網址列是 script.google.com），不是從本機檔案開的 admin.html。並確認密碼和 GAS 的 `CMS_SECRET` 完全一樣。 |
| 找不到「部署」 | 在 Apps Script 頁面**最上方**工具列（不是試算表），點 **部署**。 |

這樣就是「用 GAS 開後台」的完整流程；之後只要用 **你的GAS網址?page=admin** 就可以開後台。
