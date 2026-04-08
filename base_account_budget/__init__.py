# -*- coding: utf-8 -*-
#############################################################################
#
#    Cybrosys Technologies Pvt. Ltd.
#
#    Copyright (C) 2019-TODAY Cybrosys Technologies(<https://www.cybrosys.com>)
#    Author: Cybrosys Techno Solutions(<https://www.cybrosys.com>)
#
#    You can modify it under the terms of the GNU LESSER
#    GENERAL PUBLIC LICENSE (LGPL v3), Version 3.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU LESSER GENERAL PUBLIC LICENSE (LGPL v3) for more details.
#
#    You should have received a copy of the GNU LESSER GENERAL PUBLIC LICENSE
#    (LGPL v3) along with this program.
#    If not, see <http://www.gnu.org/licenses/>.
#
#############################################################################
from . import models


def enable_analytic_accounting(env):
    group = env.ref('analytic.group_analytic_accounting', raise_if_not_found=False)
    if group:
        # Enable analytic accounting for accounting users via implied groups
        # rather than modifying individual users
        accounting_group = env.ref('account.group_account_user', raise_if_not_found=False)
        if accounting_group and group.id not in accounting_group.implied_ids.ids:
            accounting_group.write({'implied_ids': [(4, group.id)]})
