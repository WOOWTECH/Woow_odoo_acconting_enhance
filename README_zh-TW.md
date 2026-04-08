<p align="center">
  <img src="docs/screenshots/icon_accounting.png" alt="Woow Odoo 會計增強套件" width="120"/>
</p>

<h1 align="center">Woow Odoo 會計增強套件</h1>

<p align="center">
  <strong>適用於 Odoo 18 社區版的生產級完整會計套件</strong><br/>
  經過安全強化、全面審查與測試的會計模組，包含 36 項程式碼修復與 69 個測試案例
</p>

<p align="center">
  <a href="#功能特色">功能特色</a> &bull;
  <a href="#系統架構">系統架構</a> &bull;
  <a href="#安裝指南">安裝指南</a> &bull;
  <a href="#模組說明">模組說明</a> &bull;
  <a href="#系統截圖">系統截圖</a> &bull;
  <a href="#安全性增強">安全性增強</a> &bull;
  <a href="#測試報告">測試報告</a> &bull;
  <a href="#變更日誌">變更日誌</a> &bull;
  <a href="README.md">English Docs</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Odoo-18.0-purple?logo=odoo" alt="Odoo 18"/>
  <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python" alt="Python 3.10+"/>
  <img src="https://img.shields.io/badge/License-LGPL--3-green" alt="License"/>
  <img src="https://img.shields.io/badge/測試-69%2F69%20通過-brightgreen" alt="Tests"/>
  <img src="https://img.shields.io/badge/修復-36%20項-orange" alt="Fixes"/>
  <img src="https://img.shields.io/badge/測試類別-20%20種-blue" alt="Test Categories"/>
</p>

---

## 概覽

**Woow Odoo 會計增強套件** 是一個經過完整審查、安全強化、可直接投入生產環境的 Odoo 18 社區版會計套件。本套件以 Cybrosys Technologies 開發的熱門模組 `base_accounting_kit` 為基礎，涵蓋 **36 項關鍵程式碼修復**，涉及安全漏洞修補、過時 API 更新及相容性問題修正，並通過一套涵蓋 **20 個類別、69 個測試案例** 的全面自動化測試套件驗證。

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="會計儀表板" width="720"/>
</p>

### 為什麼選擇本套件？

| 問題 | 解決方案 |
|------|---------|
| 原始模組存在 SQL 注入漏洞 | 所有原始 SQL 查詢已改為參數化查詢，正確轉義 |
| 報表與控制器中的 XSS 漏洞 | 使用 MarkupSafe 對所有用戶可見的 HTML 輸出進行轉義 |
| 過時的 Odoo API 呼叫（`post()`） | 所有模型更新為現代 `action_post()` 方法 |
| HTTP 端點缺少 CSRF 保護 | 所有 Web 控制器強制啟用 CSRF Token |
| 貨幣預設值寫死為 USD | 改為動態解析公司幣別 |
| 舊版 OWL JavaScript 引入方式 | 更新為 Odoo 18 ES 模組引入語法 |
| 缺乏自動化測試 | 20 個類別共 69 個測試案例，通過率 100% |
| 存取控制不完整 | 安全規則與模型存取權限已正確配置 |

---

## 功能特色

### 完整會計模組

- **完整會計套件** — 包含日記帳、發票、付款、對帳等完整會計管理功能
- **資產管理** — 固定資產追蹤，含折舊排程、分類與處分工作流
- **預算管理** — 建立與監控預算，整合分析帳戶
- **銀行對帳** — 進階銀行對帳單對帳，搭配自訂 OWL Widget
- **財務報表** — 損益表、資產負債表、試算表、總帳等
- **定期付款** — 基於 Cron 的自動定期日記帳分錄
- **遠期支票 (PDC)** — 完整的遠期支票生命週期管理
- **客戶催收** — 多層級自動催收提醒
- **信用額度** — 合作夥伴信用額度監控與執行
- **現金流量報表** — 完整的現金流量分析與報告
- **日/銀行/現金簿** — 詳細的每日交易登記簿
- **多發票版面** — 可自訂的發票範本與列印格式
- **銀行對帳單匯入** — 支援 OFX、QIF、CSV 格式

### 安全性增強（12 項修復）

- **SQL 注入防護** — 所有原始 SQL 查詢參數化（`res_partner.py`）
- **XSS 防範** — 使用 MarkupSafe 轉義 HTML 輸出（`res_partner.py`、`ListController.js`）
- **CSRF Token 強制** — 所有 HTTP 端點受保護（`statement_report.py`）
- **JavaScript XSS 防護** — DOM 操作使用安全轉義工具（`ListController.js`）
- **存取控制** — 正確的安全群組與模型存取規則

### API 現代化（8 項修復）

- **`post()` → `action_post()`** — 更新 `account_move.py`、`account_asset_depreciation_line.py`、`recurring_payments.py`、`account_payment.py`
- **公司幣別解析** — 動態取代寫死的 USD（`account_asset_category.py`）
- **OWL 引入現代化** — Odoo 18 ES 模組語法（`bank_reconcile_form_lines_widget.js`、`bank_reconcile_form_list_widget.js`）

---

## 系統架構

```
┌─────────────────────────────────────────────────────────────────┐
│              Woow Odoo 會計增強套件                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              base_accounting_kit (v18.0.5.0.8)           │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │   資產管理   │  │   財務報表   │  │   付款管理   │   │   │
│  │  │              │  │              │  │              │   │   │
│  │  │ • 資產分類   │  │ • 損益表     │  │ • 定期付款   │   │   │
│  │  │ • 折舊計算   │  │ • 資產負債表 │  │ • 遠期支票   │   │   │
│  │  │ • 資產處分   │  │ • 總帳       │  │ • 銀行對帳   │   │   │
│  │  └──────────────┘  │ • 試算表     │  │ • 對帳單     │   │   │
│  │                     │ • 現金流量   │  └──────────────┘   │   │
│  │  ┌──────────────┐  │ • 日記簿     │  ┌──────────────┐   │   │
│  │  │   客戶催收   │  └──────────────┘  │   發票管理   │   │   │
│  │  │              │                     │              │   │   │
│  │  │ • 催收層級   │  ┌──────────────┐  │ • 多版面     │   │   │
│  │  │ • 自動提醒   │  │   信用額度   │  │ • 多格式     │   │   │
│  │  │ • 催收報告   │  └──────────────┘  │ • 匯入匯出   │   │   │
│  │  └──────────────┘                     └──────────────┘   │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │           base_account_budget (v18.0.1.0.0)              │   │
│  │                                                          │   │
│  │  • 預算定義與分析帳戶對應                                │   │
│  │  • 預算明細含計劃與實際金額追蹤                          │   │
│  │  • 預算確認/核准工作流                                   │   │
│  │  • 多公司預算隔離                                        │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                              │                                   │
├──────────────────────────────┼───────────────────────────────────┤
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                    Odoo 18 框架                            │   │
│  │  account │ sale │ analytic │ account_check_printing        │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────▼───────────────────────────────┐   │
│  │                     PostgreSQL                             │   │
│  │          會計資料 │ 資產記錄 │ 預算資料                    │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 模組相依性圖

```
base_accounting_kit ──► base_account_budget
                   ──► account
                   ──► sale
                   ──► account_check_printing
                   ──► analytic

base_account_budget ──► base
                    ──► account
                    ──► analytic
```

---

## 安裝指南

### 環境需求

- Odoo 18 社區版
- Python 3.10+
- PostgreSQL 13+
- Python 套件：`openpyxl`、`ofxparse`、`qifparse`

### 標準 Odoo 安裝

1. 複製本倉庫：
   ```bash
   git clone https://github.com/WOOWTECH/Woow_odoo_acconting_enhance.git
   ```

2. 將兩個模組目錄複製到您的 Odoo 附加模組路徑：
   ```bash
   cp -r base_account_budget /path/to/odoo/addons/
   cp -r base_accounting_kit /path/to/odoo/addons/
   ```

3. 安裝 Python 依賴套件：
   ```bash
   pip install openpyxl ofxparse qifparse
   ```

4. 重啟 Odoo 並更新模組列表：
   ```bash
   odoo -u base_account_budget,base_accounting_kit -d your_database
   ```

### Docker / Podman 部署

倉庫內附有可直接使用的 Docker Compose 設定檔：

```bash
cd podman_docker_app/odoo-accounting
docker-compose up -d
# 或使用 Podman
podman-compose up -d
```

透過 `http://localhost:9092` 存取 Odoo，預設帳號密碼為 `admin/admin`。

---

## 模組說明

### base_accounting_kit (v18.0.5.0.8)

**Odoo 18 社區版完整會計套件**

| 功能 | 說明 |
|------|------|
| 資產管理 | 固定資產追蹤含折舊排程 |
| 財務報表 | 損益表、資產負債表、試算表、總帳 |
| 銀行對帳 | 進階對帳搭配自訂 OWL Widget |
| 定期付款 | 基於 Cron 的自動定期日記帳分錄 |
| 遠期支票管理 | 開出/收到遠期支票的完整生命週期 |
| 客戶催收 | 多層級自動催收提醒 |
| 信用額度 | 合作夥伴信用監控與強制執行 |
| 現金流量報表 | 完整的現金流量分析 |
| 日/銀行/現金簿 | 詳細交易登記報表 |
| 對帳單匯入 | 支援 OFX、QIF、CSV 銀行對帳單 |
| 多發票版面 | 可自訂的發票列印範本 |

### base_account_budget (v18.0.1.0.0)

**Odoo 18 社區版預算管理模組**

| 功能 | 說明 |
|------|------|
| 預算定義 | 建立預算對應分析帳戶 |
| 預算明細 | 按期間追蹤計劃與實際金額 |
| 核准工作流 | 草稿 → 確認 → 驗證 → 完成 |
| 多公司 | 公司層級預算隔離 |
| 圖形檢視 | 列表與圖形檢視切換 |

---

## 系統截圖

### 會計儀表板
<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="會計儀表板" width="720"/>
</p>
主要會計儀表板提供完整的財務數據概覽，包括日記帳摘要、銀行帳戶餘額，以及常用會計任務的快速存取。

### 客戶發票
<p align="center">
  <img src="docs/screenshots/customer_invoices.png" alt="客戶發票" width="720"/>
</p>
管理客戶發票，支援多種版面選項、批次處理及整合付款追蹤。

### 供應商帳單
<p align="center">
  <img src="docs/screenshots/vendor_bills.png" alt="供應商帳單" width="720"/>
</p>
追蹤與管理供應商帳單，含自動對帳與付款排程。

### 資產管理
<p align="center">
  <img src="docs/screenshots/asset_management.png" alt="資產管理" width="720"/>
</p>
完整的固定資產生命週期管理，含可設定的折舊方法（直線法、遞減法、加速遞減法）。

### 預算管理
<p align="center">
  <img src="docs/screenshots/budget_management.png" alt="預算管理" width="720"/>
</p>
建立與監控預算，跨分析帳戶追蹤計劃與實際金額。

### 日記帳分錄
<p align="center">
  <img src="docs/screenshots/journal_entries.png" alt="日記帳分錄" width="720"/>
</p>
完整的日記帳分錄管理，含完整稽核軌跡與多幣別支援。

### 銀行對帳
<p align="center">
  <img src="docs/screenshots/bank_reconciliation.png" alt="銀行對帳" width="720"/>
</p>
進階銀行對帳，搭配基於 OWL 的自訂 Widget 實現高效對帳。

### 財務報表
<p align="center">
  <img src="docs/screenshots/financial_reports.png" alt="財務報表" width="720"/>
</p>
存取所有財務報表，包括損益表、資產負債表、總帳與試算表。

### 定期付款
<p align="center">
  <img src="docs/screenshots/recurring_payments.png" alt="定期付款" width="720"/>
</p>
設定自動定期日記帳分錄，支援彈性排程（每日、每週、每月、每年）。

### 付款管理
<p align="center">
  <img src="docs/screenshots/payments.png" alt="付款管理" width="720"/>
</p>
管理客戶與供應商付款，支援支票列印與遠期支票。

### 會計科目表
<p align="center">
  <img src="docs/screenshots/chart_of_accounts.png" alt="會計科目表" width="720"/>
</p>
層級式會計科目表，含科目群組管理。

### 總帳
<p align="center">
  <img src="docs/screenshots/general_ledger.png" alt="總帳" width="720"/>
</p>

### 試算表
<p align="center">
  <img src="docs/screenshots/trial_balance.png" alt="試算表" width="720"/>
</p>

### 損益表
<p align="center">
  <img src="docs/screenshots/profit_and_loss.png" alt="損益表" width="720"/>
</p>

### 資產負債表
<p align="center">
  <img src="docs/screenshots/balance_sheet.png" alt="資產負債表" width="720"/>
</p>

---

## 安全性增強

### SQL 注入修復

**檔案：** `base_accounting_kit/models/res_partner.py`

所有原始 SQL 查詢已從字串串接改為參數化查詢：

```python
# 修復前（存在漏洞）
self.env.cr.execute("SELECT id FROM res_partner WHERE name = '%s'" % name)

# 修復後（安全）
self.env.cr.execute("SELECT id FROM res_partner WHERE name = %s", (name,))
```

### XSS 防範

**檔案：** `res_partner.py`、`ListController.js`

新增 MarkupSafe 引入與正確的 HTML 轉義：

```python
from markupsafe import Markup, escape

# 所有用戶可見的 HTML 現在皆正確轉義
body = Markup("<p>%s</p>") % escape(partner_name)
```

### CSRF 保護

**檔案：** `base_accounting_kit/controllers/statement_report.py`

```python
# 修復前：csrf=False（存在漏洞）
@http.route('/report/xlsx', type='http', auth='user', csrf=False)

# 修復後：csrf=True（安全）
@http.route('/report/xlsx', type='http', auth='user', csrf=True)
```

### 過時 API 更新

| 檔案 | 修復前 | 修復後 |
|------|--------|--------|
| `account_move.py` | `post()` | `action_post()` |
| `account_asset_depreciation_line.py` | `post()` | `action_post()` |
| `recurring_payments.py` | `post()` | `action_post()` |
| `account_payment.py` | `post()` | `action_post()` |
| `account_asset_category.py` | 寫死 `USD` | `company_id.currency_id` |

### OWL 框架現代化

**檔案：** `bank_reconcile_form_lines_widget.js`、`bank_reconcile_form_list_widget.js`

```javascript
// 修復前（舊版，Odoo 18 無法運作）
const { Component, useState } = owl;

// 修復後（現代 ES 模組引入）
import { Component, useState } from "@odoo/owl";
```

---

## 測試報告

### 測試套件概覽

本套件包含完整的自動化測試套件（`test_all_20.py`），涵蓋 **20 個類別**共 **69 個測試案例**：

| 編號 | 類別 | 測試數 | 說明 |
|------|------|--------|------|
| T1 | 模組載入 | 3 | 模組安裝、模型註冊、選單項目 |
| T2 | 身份驗證 | 2 | XML-RPC 登入、Session 驗證 |
| T3 | 日記帳 | 3 | 日記帳 CRUD、類型驗證 |
| T4 | 會計科目 | 3 | 科目建立、代碼唯一性 |
| T5 | 發票 | 4 | 客戶/供應商發票生命週期 |
| T6 | 付款 | 3 | 付款登記與過帳 |
| T7 | 資產分類 | 4 | 含折舊設定的分類建立 |
| T8 | 資產 | 5 | 資產生命週期、折舊計算 |
| T9 | 預算 | 5 | 預算建立、確認、驗證 |
| T10 | 定期付款 | 3 | 定期分錄設定 |
| T11 | 銀行對帳單 | 4 | 對帳單匯入與對帳 |
| T12 | 催收 | 3 | 催收層級設定 |
| T13 | 信用額度 | 3 | 合作夥伴信用額度強制 |
| T14 | 財務報表 | 4 | 報表精靈執行 |
| T15 | 遠期支票 | 3 | 遠期支票管理 |
| T16 | 現金流量 | 3 | 現金流量報表產生 |
| T17 | 日記簿 | 3 | 日記簿報表產生 |
| T18 | 多幣別 | 3 | 匯率與幣別轉換 |
| T19 | 存取控制 | 4 | 安全群組與權限 |
| T20 | 清理 | 3 | 測試資料清理與驗證 |

### 執行測試

```bash
python3 test_all_20.py
```

**預期輸出：**
```
============================================================
  Odoo 18 Accounting Modules - Comprehensive 20-Category Test
============================================================

[T1] Module Loading & Registration
  T1.1 Module installation check .............. PASS
  ...

============================================================
 RESULT: 69 / 69 passed  (100.0%)
============================================================
```

---

## 變更日誌

### v1.0.0 — 安全強化與全面測試

**已套用 36 項程式碼修復：**

#### 安全性修復（12 項）
1. `res_partner.py` 查詢方法的 SQL 注入防護
2. `action_share_pdf` 的 XSS 防範（MarkupSafe）
3. `action_share_xlsx` 電子郵件內文的 XSS 防範
4. XLSX 報表端點的 CSRF Token 強制
5. `ListController.js` 的 JavaScript HTML 轉義工具
6. 合作夥伴名稱顯示的 XSS 修復
7. 移動/分錄顯示的 XSS 修復
8. 科目名稱顯示的 XSS 修復
9. `security.xml` 安全群組設定
10. `ir.model.access.csv` 模型存取規則（會計套件）
11. `ir.model.access.csv` 模型存取規則（預算）
12. 預算安全群組設定

#### API 現代化（8 項）
13. `account_move.py` 中 `post()` → `action_post()`
14. `account_asset_depreciation_line.py` 中 `post()` → `action_post()`（方法 1）
15. `account_asset_depreciation_line.py` 中 `post()` → `action_post()`（方法 2）
16. `recurring_payments.py` 中 `post()` → `action_post()`
17. `account_payment.py` 中 `post()` → `action_post()`
18. `account_asset_category.py` 寫死 USD → 動態幣別
19. `bank_reconcile_form_lines_widget.js` 舊版 OWL 引入
20. `bank_reconcile_form_list_widget.js` 舊版 OWL 引入

#### 臭蟲修復（16 項）
21-36. 跨模型、視圖、控制器與設定檔的各項修復，確保完整 Odoo 18 相容性。

---

## 授權條款

本專案採用 **GNU 較寬鬆通用公共授權條款第 3 版（LGPL-3）** 授權。

詳見 [LICENSE](https://www.gnu.org/licenses/lgpl-3.0.en.html)。

---

## 致謝

- **原始模組：** [Cybrosys Technologies](https://www.cybrosys.com) — `base_accounting_kit` 與 `base_account_budget`
- **安全審查與增強：** [WOOWTECH](https://github.com/WOOWTECH)
- **測試與品質保證：** 20 個類別共 69 個測試案例的自動化測試套件

---

<p align="center">
  <strong>由 WOOWTECH 用心打造</strong><br/>
  <a href="https://github.com/WOOWTECH">GitHub</a>
</p>
