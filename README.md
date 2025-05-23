# 麥克風電池計時器

這是一個網頁應用程式，專為電影現場錄音工作者設計。此應用可以幫助追蹤多組麥克風的電池使用時間，並提供倒數計時功能以提醒用戶何時需要更換電池。

## 功能

- 可以同時追蹤最多4組麥克風的電池使用時間
- 為每組麥克風設置不同的倒數時間
- 直觀的進度條顯示剩餘電池時間
- 當電池剩餘時間低於30分鐘時提供視覺警告
- 儲存計時記錄，方便查看過去的使用情況
- 支援刪除計時器和歷史記錄

## 使用方法

1. 在「新增麥克風計時」區域中，輸入麥克風名稱（例如：演員名字）
2. 設置電池使用時間（小時和分鐘）
3. 點擊「新增計時器」按鈕開始倒數計時
4. 當前活動的計時器會顯示在「當前計時器」區域
5. 完成的計時器會自動移至「歷史記錄」區域
6. 可以隨時點擊「完成」或「刪除」按鈕管理計時器

## 技術實現

- 使用純HTML、CSS和JavaScript開發
- 使用localStorage存儲計時器數據，無需後端伺服器
- 響應式設計，適合在不同大小的螢幕上使用

## 本地運行

只需在瀏覽器中打開index.html文件即可使用此應用。所有數據都存儲在瀏覽器的localStorage中，清除瀏覽器數據會導致記錄丟失。 