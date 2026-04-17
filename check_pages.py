#!/usr/bin/env python3
"""Check which Odoo pages show Missing Action errors."""
import time, os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

ODOO_URL = "http://localhost:9092"

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")
opts.add_argument("--disable-gpu")
opts.add_argument("--window-size=1920,1080")

driver = webdriver.Chrome(options=opts)
driver.implicitly_wait(3)

def login():
    driver.get(f"{ODOO_URL}/web/login")
    time.sleep(2)
    driver.find_element(By.ID, "login").clear()
    driver.find_element(By.ID, "login").send_keys("admin")
    driver.find_element(By.ID, "password").clear()
    driver.find_element(By.ID, "password").send_keys("admin")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(3)
    print("Logged in\n")

# Test using the new path values we added
pages = [
    ("/odoo/accounting", "dashboard"),
    ("/odoo/customer-invoices", "customer_invoices"),
    ("/odoo/vendor-bills", "vendor_bills"),
    ("/odoo/assets", "assets"),
    ("/odoo/asset-types", "asset_types"),
    ("/odoo/budgets", "budgets"),
    ("/odoo/budgetary-positions", "budgetary_positions"),
    ("/odoo/recurring-payments", "recurring_payments"),
    ("/odoo/followup-reports", "followup_reports"),
    ("/odoo/payment-followups", "payment_followups"),
    ("/odoo/account-groups", "account_groups"),
    ("/odoo/financial-reports", "financial_reports"),
    ("/odoo/bank-statements", "bank_statements"),
    ("/odoo/bank-transactions", "bank_transactions"),
    ("/odoo/general-ledger", "general_ledger"),
    ("/odoo/trial-balance", "trial_balance"),
    ("/odoo/profit-and-loss", "profit_and_loss"),
    ("/odoo/balance-sheet", "balance_sheet"),
    ("/odoo/cash-flow", "cash_flow"),
    ("/odoo/day-book", "day_book"),
    ("/odoo/bank-book", "bank_book"),
    ("/odoo/cash-book", "cash_book"),
    ("/odoo/partner-ledger", "partner_ledger"),
    ("/odoo/aged-partner-balance", "aged_partner_balance"),
    ("/odoo/journals-audit", "journals_audit"),
    ("/odoo/tax-reports", "tax_reports"),
    ("/odoo/lock-dates", "lock_dates"),
    ("/odoo/assets-analysis", "assets_analysis"),
]

ok = 0
fail = 0
try:
    login()
    for url, name in pages:
        driver.get(f"{ODOO_URL}{url}")
        time.sleep(3)
        page_source = driver.page_source
        if "Missing Action" in page_source or "does not exist" in page_source:
            fail += 1
            print(f"  FAIL  {name:25s} {url}")
        else:
            ok += 1
            title = driver.title
            print(f"  OK    {name:25s} {url} (title: {title})")
    print(f"\n=== RESULT: {ok} OK, {fail} FAIL out of {ok+fail} ===")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    driver.quit()
