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
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class AccountBudgetPost(models.Model):
    """Model used to create the Budgetary Position for the account"""
    _name = "account.budget.post"
    _order = "name"
    _description = "Budgetary Position"

    name = fields.Char('Name', required=True)
    account_ids = fields.Many2many('account.account', 'account_budget_rel',
                                   'budget_id', 'account_id', 'Accounts')
    budget_line = fields.One2many('budget.lines', 'general_budget_id',
                                  'Budget Lines')
    company_id = fields.Many2one('res.company', 'Company', required=True,
                                 default=lambda self: self.env.company)

    @api.constrains('account_ids')
    def _check_account_ids(self):
        for record in self:
            if not record.account_ids:
                raise ValidationError(
                    _('The budget must have at least one account.'))


class Budget(models.Model):
    _name = "budget.budget"
    _description = "Budget"
    _inherit = ['mail.thread']

    name = fields.Char('Budget Name', required=True)
    creating_user_id = fields.Many2one('res.users', 'Responsible',
                                       default=lambda self: self.env.user)
    date_from = fields.Date('Start Date', required=True)
    date_to = fields.Date('End Date', required=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('cancel', 'Cancelled'),
        ('confirm', 'Confirmed'),
        ('validate', 'Validated'),
        ('done', 'Done')
    ], 'Status', default='draft', index=True, required=True, readonly=True,
        copy=False, tracking=True)
    budget_line = fields.One2many('budget.lines', 'budget_id', 'Budget Lines',
                                  copy=True)
    company_id = fields.Many2one('res.company', 'Company', required=True,
                                 default=lambda self: self.env.company)

    def action_budget_confirm(self):
        self.write({'state': 'confirm'})

    def action_budget_draft(self):
        self.write({'state': 'draft'})

    def action_budget_validate(self):
        self.write({'state': 'validate'})

    def action_budget_cancel(self):
        self.write({'state': 'cancel'})

    def action_budget_done(self):
        self.write({'state': 'done'})


class BudgetLines(models.Model):
    _name = "budget.lines"
    _rec_name = "budget_id"
    _description = "Budget Line"

    budget_id = fields.Many2one('budget.budget', 'Budget', ondelete='cascade',
                                index=True, required=True)
    analytic_account_id = fields.Many2one('account.analytic.account',
                                          'Analytic Account')
    general_budget_id = fields.Many2one('account.budget.post',
                                        'Budgetary Position', required=True)
    date_from = fields.Date('Start Date', required=True)
    date_to = fields.Date('End Date', required=True)
    paid_date = fields.Date('Paid Date')
    planned_amount = fields.Float('Planned Amount', required=True, digits=0)
    practical_amount = fields.Float(compute='_compute_practical_amount',
                                    string='Practical Amount', digits=0)
    theoretical_amount = fields.Float(compute='_compute_theoretical_amount',
                                      string='Theoretical Amount', digits=0)
    percentage = fields.Float(compute='_compute_percentage',
                              string='Achievement')
    company_id = fields.Many2one(related='budget_id.company_id',
                                 comodel_name='res.company',
                                 string='Company', store=True, readonly=True)
    currency_id = fields.Many2one(related='company_id.currency_id',
                                  string='Currency', readonly=True)

    def _compute_practical_amount(self):
        for line in self:
            result = 0.0
            acc_ids = line.general_budget_id.account_ids.ids
            date_to = self.env.context.get('wizard_date_to') or line.date_to
            date_from = self.env.context.get(
                'wizard_date_from') or line.date_from
            if line.analytic_account_id.id and acc_ids:
                analytic_lines = self.env['account.analytic.line'].search([
                    ('account_id', '=', line.analytic_account_id.id),
                    ('date', '>=', date_from),
                    ('date', '<=', date_to),
                ])
                for al in analytic_lines:
                    if al.move_line_id and al.move_line_id.account_id.id in acc_ids:
                        result += al.amount
            line.practical_amount = result

    def _compute_theoretical_amount(self):
        today = fields.Date.today()
        for line in self:
            theo_amt = 0.00
            if self.env.context.get(
                    'wizard_date_from') and self.env.context.get(
                'wizard_date_to'):
                date_from = fields.Date.to_date(
                    self.env.context.get('wizard_date_from'))
                date_to = fields.Date.to_date(
                    self.env.context.get('wizard_date_to'))
                if date_from < line.date_from:
                    date_from = line.date_from
                elif date_from > line.date_to:
                    date_from = False

                if date_to > line.date_to:
                    date_to = line.date_to
                elif date_to < line.date_from:
                    date_to = False

                if date_from and date_to:
                    line_days = (line.date_to - line.date_from).days
                    elapsed_days = (date_to - date_from).days
                    if elapsed_days > 0 and line_days > 0:
                        theo_amt = (elapsed_days / line_days) * line.planned_amount
            else:
                if line.paid_date:
                    if line.date_to <= line.paid_date:
                        theo_amt = 0.00
                    else:
                        theo_amt = line.planned_amount
                else:
                    if today < line.date_from:
                        theo_amt = 0.00
                    elif today < line.date_to:
                        total_days = (line.date_to - line.date_from).days + 1
                        days_over = (today - line.date_from).days + 1
                        theo_amt = line.planned_amount / total_days * days_over
                    else:
                        theo_amt = line.planned_amount
            line.theoretical_amount = theo_amt

    def _compute_percentage(self):
        for line in self:
            if line.theoretical_amount != 0.00:
                line.percentage = float((line.practical_amount or 0.0) / line.theoretical_amount) * 100
            else:
                line.percentage = 0.00
