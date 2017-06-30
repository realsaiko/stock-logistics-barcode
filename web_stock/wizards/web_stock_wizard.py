# -*- coding: utf-8 -*-
# Copyright 2016 LasLabs Inc.
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from collections import defaultdict

from openerp import api, models, fields


import logging
_logger = logging.getLogger(__name__)


class WebsiteStockPickingWizard(models.TransientModel):
    _name = "website.stock.picking.wizard"
    _description = 'Website Stock Picking Wizard'

    search_query = fields.Char()
    #search_domains = fields.Char(default=_default_domains)
    # picking_type = fields.Selection([
    #     ('incoming', 'Incoming'),
    #     ('outgoing', 'Outgoing'),
    #     ('internal', 'Internal'),
    # ])
    picking_state = fields.Selection([
        ('draft', 'Draft'),
        ('cancel', 'Cancelled'),
        ('waiting', 'Waiting Another Operation'),
        ('confirmed', 'Waiting Availability'),
        ('partially_available', 'Partially Available'),
        ('assigned', 'Available'),
        ('done', 'Done'),
    ],
        default='assigned',
    )
    picking_type_id = fields.Many2one(
        string='Picking Type',
        comodel_name='stock.picking.type',
    )
    company_id = fields.Many2one(
        string='Company',
        comodel_name='res.company',
        default=lambda s: s.env.user.company_id.id,
        required=True,
    )
    picking_ids = fields.Many2many(
        string='Pickings',
        comodel_name='stock.picking',
    )

    def _search_domains(self, search_by):
        domains = [
            '|','|','|','|','|',
            ('origin', 'ilike', search_by),
            ('name', 'ilike', search_by),
            ('backorder_id.name', 'ilike', search_by),
            ('move_lines.name', 'ilike', search_by),
            ('move_lines.product_id.barcode', 'ilike', search_by),
            ('partner_id.name', 'ilike', search_by),
        ]
        return domains

    @api.multi
    def _get_domain(self):
        self.ensure_one()
        domain = [
            ('company_id', '=', self.company_id.id),
        ]
        if self.search_query:
            domain.extend(self._search_domains(self.search_query))
        if self.picking_type_id:
            domain.append(('picking_type_id', '=', self.picking_type_id.id))
        # elif self.picking_type:  # Don't search for a picking type and code
        #     domain.append(('picking_type_id.code', '=', self.picking_type))
        if self.picking_state:
            domain.append(('state', '=', self.picking_state))
        return domain

    @api.model
    def create(self, vals):
        rec_id = super(WebsiteStockPickingWizard, self).create(vals)
        rec_id.action_search()
        return rec_id

    @api.multi
    def write(self, vals):
        res = super(WebsiteStockPickingWizard, self).write(vals)
        if not self.env.context.get('skip_action_search'):
            self.action_search()
        return res

    @api.model
    def action_get_wizard(self):
        """ Return the wizard for the user """
        wizard_obj = self.env['website.stock.picking.wizard']
        return wizard_obj.search([
            ('create_uid', '=', self.env.user.id),
        ],
            limit=1,
        )

    @api.multi
    def action_search(self):
        for rec_id in self.with_context(skip_action_search=True):
            pick_ids = self.env['stock.picking'].search(self._get_domain())
            rec_id.write({
                'picking_ids': [(6, 0, pick_ids.ids)]
            })

    @api.model
    def action_process_form(self, picking_id, form_values):
        lot_key = '%s.pack_lots_ids.lot_name' % picking_id.id
        #if lot_key in form_values.keys():
        #    print('yra lots')
        #else:
        #    print('nera lots')
        vals = self._process_form_vals(form_values)
        picking_id.write(
            vals
        )

    @api.model
    def _process_lots(self, form_values):
        for k, v in form_values.iteritems:
            _logger.debug('lot_key: %s , lot_value: %s', k, v)
        return False

    @api.model
    def _process_form_vals(self, form_values):
        field_map = defaultdict(dict)
        lot_map = defaultdict(dict)
        for name, value in form_values.iteritems():
            try:
                op_id, field = name.split('.', 1)
                _logger.debug('op_id: %s , field: %s', op_id, field)
            except ValueError:
                continue
            if 'pack_lots_ids' in field:
                try:
                    pack_lots, field2, lot_id = field.split('.', 2)
                except ValueError:
                    continue
                #lot[lot_id][field2] = value
                lot_map[op_id+'.'+lot_id][field2] = value
            else:
                field_map[op_id][field] = value
            #if pack_lots == 'pack_lots_ids':
            #    lot_map[lot_id][field2] = value
            #    lot_maps[op_id] = lot_map
        if lot_map:
            lot_ids = self._process_lots(lot_map)

        return {
            'pack_operation_product_ids': [
                (1, int(k), v) for k, v in field_map.iteritems()
            ]
        }
