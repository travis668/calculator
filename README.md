# 離線計算機 PWA

第一次用瀏覽器開啟後，Service Worker 會快取 App Shell。之後即使離線，也可以再次開啟並使用計算機。

## 本機啟動

```bash
npm run serve
```

開啟：

```text
http://127.0.0.1:4173/
```

## 離線驗證

1. 先在線上開啟一次頁面。
2. 等頁面右上角顯示「已可離線使用」。
3. 關閉網路或在 DevTools Application 面板勾選 Offline。
4. 重新整理頁面，計算機仍可使用。

## 測試

```bash
npm test
```
