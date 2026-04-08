#!/usr/bin/env python3
"""Retake all screenshots with correct URLs."""
import time, os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

ODOO_URL = "http://localhost:9092"
OUTDIR = "/var/tmp/vibe-kanban/worktrees/891c-github/Woow_odoo_acconting_enhance/docs/screenshots"
os.makedirs(OUTDIR, exist_ok=True)

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")
opts.add_argument("--disable-gpu")
opts.add_argument("--window-size=1920,1080")

driver = webdriver.Chrome(options=opts)
driver.implicitly_wait(3)

def screenshot(name, delay=3):
    time.sleep(delay)
    path = os.path.join(OUTDIR, f"{name}.png")
    driver.save_screenshot(path)
    sz = os.path.getsize(path)
    print(f"  Saved: {name}.png ({sz} bytes)")

def login():
    driver.get(f"{ODOO_URL}/web/login")
    time.sleep(2)
    driver.find_element(By.ID, "login").clear()
    driver.find_element(By.ID, "login").send_keys("admin")
    driver.find_element(By.ID, "password").clear()
    driver.find_element(By.ID, "password").send_keys("admin")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(3)
    print("Logged in")

pages = [
    ("/odoo/accounting", "dashboard", 4),
    ("/odoo/customer-invoices", "customer_invoices", 3),
    ("/odoo/vendor-bills", "vendor_bills", 3),
    ("/odoo/assets", "asset_management", 3),
    ("/odoo/asset-types", "asset_categories", 3),
    ("/odoo/budgets", "budget_management", 3),
    ("/odoo/recurring-payments", "recurring_payments", 3),
    ("/odoo/followup-reports", "customer_followup", 3),
    ("/odoo/payment-followups", "payment_followups", 3),
    ("/odoo/account-groups", "account_groups", 3),
    ("/odoo/financial-reports", "financial_reports", 3),
    ("/odoo/bank-statements", "bank_statements", 3),
    ("/odoo/bank-transactions", "bank_transactions", 3),
    ("/odoo/general-ledger", "general_ledger", 3),
    ("/odoo/trial-balance", "trial_balance", 3),
    ("/odoo/profit-and-loss", "profit_and_loss", 3),
    ("/odoo/balance-sheet", "balance_sheet", 3),
    ("/odoo/cash-flow", "cash_flow", 3),
    ("/odoo/day-book", "day_book", 3),
    ("/odoo/bank-book", "bank_book", 3),
    ("/odoo/cash-book", "cash_book", 3),
    ("/odoo/partner-ledger", "partner_ledger", 3),
    ("/odoo/aged-partner-balance", "aged_partner_balance", 3),
    ("/odoo/journals-audit", "journals_audit", 3),
    ("/odoo/tax-reports", "tax_reports", 3),
    ("/odoo/lock-dates", "lock_dates", 3),
    ("/odoo/assets-analysis", "assets_analysis", 3),
]

# Also need these pages that don't have path-based URLs
# They're accessed via standard Odoo URLs
extra_pages = [
    ("/odoo/accounting", "chart_of_accounts", 3),  # Will navigate via menu
]

try:
    login()
    for url, name, delay in pages:
        print(f"Taking: {name}...")
        driver.get(f"{ODOO_URL}{url}")
        screenshot(name, delay=delay)

    # For payments, use the standard account module path
    print("Taking: payments...")
    driver.get(f"{ODOO_URL}/odoo/accounting")
    time.sleep(3)
    # Navigate to Customers > Payments via clicking menu
    try:
        customers_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Customers')]")
        customers_btn.click()
        time.sleep(1)
        payments_link = driver.find_element(By.XPATH, "//a[@role='menuitem'][contains(text(),'Payments')]")
        payments_link.click()
        time.sleep(3)
        screenshot("payments")
    except Exception as e:
        print(f"  Could not navigate to payments: {e}")

    # Chart of Accounts
    print("Taking: chart_of_accounts...")
    driver.get(f"{ODOO_URL}/odoo/accounting")
    time.sleep(3)
    try:
        config_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Configuration')]")
        config_btn.click()
        time.sleep(1)
        coa_link = driver.find_element(By.XPATH, "//a[@role='menuitem'][contains(text(),'Chart of Accounts')]")
        coa_link.click()
        time.sleep(3)
        screenshot("chart_of_accounts")
    except Exception as e:
        print(f"  Could not navigate to chart of accounts: {e}")

    # Journal Entries
    print("Taking: journal_entries...")
    driver.get(f"{ODOO_URL}/odoo/accounting")
    time.sleep(3)
    try:
        acct_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Accounting') and @role='menuitem']")
        acct_btn.click()
        time.sleep(1)
        je_link = driver.find_element(By.XPATH, "//a[@role='menuitem'][contains(text(),'Journal Entries')]")
        je_link.click()
        time.sleep(3)
        screenshot("journal_entries")
    except Exception as e:
        print(f"  Could not navigate to journal entries: {e}")

    # PDC Management
    print("Taking: pdc_management...")
    driver.get(f"{ODOO_URL}/odoo/accounting")
    time.sleep(3)
    try:
        acct_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Accounting') and @role='menuitem']")
        acct_btn.click()
        time.sleep(1)
        pdc_link = driver.find_element(By.XPATH, "//a[@role='menuitem'][contains(text(),'PDC')]")
        pdc_link.click()
        time.sleep(3)
        screenshot("pdc_management")
    except Exception as e:
        print(f"  Could not navigate to PDC: {e}")

    # Bank Reconciliation
    print("Taking: bank_reconciliation...")
    driver.get(f"{ODOO_URL}/odoo/accounting")
    time.sleep(3)
    try:
        acct_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Accounting') and @role='menuitem']")
        acct_btn.click()
        time.sleep(1)
        br_link = driver.find_element(By.XPATH, "//a[@role='menuitem'][contains(text(),'Bank Reconciliation')]")
        br_link.click()
        time.sleep(3)
        screenshot("bank_reconciliation")
    except Exception as e:
        print(f"  Could not navigate to bank reconciliation: {e}")

    print(f"\nDone! Total files: {len(os.listdir(OUTDIR))}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    driver.quit()
