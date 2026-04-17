#!/usr/bin/env python3
"""Discover all accounting menu items and their action URLs via Odoo RPC."""
import xmlrpc.client

URL = "http://localhost:9092"
DB = "odooaccounting"
USER = "admin"
PASS = "admin"

common = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/common", allow_none=True)
uid = common.authenticate(DB, USER, PASS, {})
models = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/object", allow_none=True)

def rpc(model, method, *args, **kwargs):
    return models.execute_kw(DB, uid, PASS, model, method, *args, **kwargs)

# Find all accounting menus
print("=== Accounting App Menus ===\n")
app_menus = rpc('ir.ui.menu', 'search_read',
    [[('name', 'ilike', 'Accounting'), ('parent_id', '=', False)]],
    {'fields': ['id', 'name', 'action']})

for app in app_menus:
    print(f"App: {app['name']} (id={app['id']})")
    all_menus = rpc('ir.ui.menu', 'search_read',
        [[('id', 'child_of', app['id'])]],
        {'fields': ['id', 'name', 'parent_id', 'action', 'sequence'],
         'order': 'sequence'})
    for m in all_menus:
        action_str = m.get('action') or ''
        parent = m.get('parent_id')
        parent_name = parent[1] if parent else '-'
        print(f"  [{m['id']}] {parent_name} > {m['name']} (action={action_str})")

# Get actions with path
print("\n=== All ir.actions.act_window with 'path' set ===\n")
all_actions_with_path = rpc('ir.actions.act_window', 'search_read',
    [[('path', '!=', False)]],
    {'fields': ['id', 'name', 'res_model', 'path', 'xml_id']})
for a in all_actions_with_path:
    if a.get('path'):
        print(f"  path='{a['path']}' | {a.get('xml_id','')} | {a['name']} (model={a['res_model']})")

# Base accounting kit actions
print("\n=== base_accounting_kit actions ===\n")
kit_actions = rpc('ir.actions.act_window', 'search_read',
    [[('xml_id', 'ilike', 'base_accounting_kit')]],
    {'fields': ['id', 'name', 'res_model', 'path', 'xml_id']})
for a in kit_actions:
    print(f"  xml_id={a.get('xml_id','')}")
    print(f"    name={a['name']}, model={a['res_model']}, path={a.get('path','')}")

print("\n=== base_account_budget actions ===\n")
budget_actions = rpc('ir.actions.act_window', 'search_read',
    [[('xml_id', 'ilike', 'base_account_budget')]],
    {'fields': ['id', 'name', 'res_model', 'path', 'xml_id']})
for a in budget_actions:
    print(f"  xml_id={a.get('xml_id','')}")
    print(f"    name={a['name']}, model={a['res_model']}, path={a.get('path','')}")
