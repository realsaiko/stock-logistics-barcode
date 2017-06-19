# -*- coding: utf-8 -*-
# Copyright 2016 LasLabs Inc.
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

{
    "name": "Web Stock Picking",
    "summary": "Add web/barcode workflows for stock picking.",
    "version": "9.0.2.0.0",
    "category": "Warehouse",
    "website": "https://laslabs.com/",
    "author": "Saulius Zilys, LasLabs, Odoo Community Association (OCA)",
    "license": "LGPL-3",
    "installable": True,
    "depends": [
        "barcodes",
        "stock",
        "web_editor",
    ],
    "data": [
        'wizards/web_stock_wizard_template.xml',
        'views/web_warehouse.xml',
        'views/stock_picking_type.xml',
        'views/warehouse_menu.xml',
    ],
}
