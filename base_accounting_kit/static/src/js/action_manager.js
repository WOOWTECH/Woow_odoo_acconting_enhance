/** @odoo-module*/
import {registry} from "@web/core/registry";
import {download} from "@web/core/network/download";
// Action manager for xlsx report
registry.category('ir.actions.report handlers').add('xlsx', async (action, options, env) => {
    if (action.report_type === 'xlsx'){
        const blockUI = env && env.services && env.services.ui
            ? () => env.services.ui.block()
            : () => {};
        const releaseUI = env && env.services && env.services.ui
            ? () => env.services.ui.unblock()
            : () => {};
        blockUI();
        try {
            await download({
                url: '/xlsx_report',
                data: action.data,
            });
        } finally {
            releaseUI();
        }
    }
})
