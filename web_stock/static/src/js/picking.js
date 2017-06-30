/* Copyright 2016-2017 LasLabs Inc.
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

odoo.define('web_stock.picking', function(require) {
    'use strict';
    
    var Dialog = require('web.Dialog');
    var snippet_animation = require('web_editor.snippets.animation');

    var Widget = require('web.Widget');
    
    var mixins = require('web_stock.mixins');
    
    var core = require('web.core');
    var _t = core._t;

    var ModalBackorder = Dialog.extend(mixins.pickingDialogMixin, {
        
        options: {
            title: _t('Create Backorder?'),
            $content: $('<div>').append(
                            $('<p>').html(
                                _t('You have processed less products than the initial demand.')
                            )
                        ).append(
                            $('<p>').html(
                                _t('Create a backorder if you expect to process ' +
                                   'the remaining products later. ')
                            )
                        ).append(
                            $('<p>').html(
                                _t('Do not create a backorder if you will not supply the ' +
                                   'remaining products.')
                            )
                        ),
            buttons: [
                {
                    text: _t('Create Backorder'),
                    classes: 'btn btn-primary js_picking_btn_additional',
                    close: true,
                    click: function() {
                        $('.js_picking_additional_action').val('process');
                        $('.js-picking-validate').trigger('click');
                    }
                },
                {
                    text: _t('No Backorder'),
                    classes: 'btn btn-primary js_picking_btn_additional',
                    close: true,
                    click: function() {
                        $('.js_picking_additional_action').val('process_cancel_backorder');
                        $('.js-picking-validate').trigger('click');
                    }
                },
                {
                    text: _t('Cancel'),
                    classes: 'btn btn-default',
                    close: true,
                },
            ]
        },
        
    });
    
    var ModalImmediate = Dialog.extend(mixins.pickingDialogMixin, {
        
        options: {
            title: _t('Immediate Transfer?'),
            $content: $('<div>').append(
                            $('<p>').html(
                                _t('You have not set any processed quantities.')
                            )
                        ).append(
                            $('<p>').html(
                                _t('If you click `Apply`, Odoo will process all quantities to do.')
                            )
                        ),
            buttons: [
                {
                    text: _t('Apply'),
                    classes: 'btn btn-primary js_picking_btn_additional',
                    close: true,
                    click: function() {
                        $('.js_picking_additional_action').val('immediate_transfer');
                        $('.js-picking-validate').trigger('click');
                    }
                },
                {
                    text: _t('Cancel'),
                    classes: 'btn btn-default',
                    close: true,
                },
            ]
        },
        
    });
    
    var ModalOverpick = Dialog.extend(mixins.pickingDialogMixin, {
        
        options: {
            title: _t('Overpick?'),
            $content: $('<div>').append(
                            $('<p>').html(
                                _t('You are about to pick more units than to do units.')
                            )
                        ).append(
                            $('<p>').html(
                                _t('Proceeding with this operation will increase the ' +
                                   'number of to do units before picking.')
                            )
                        ),
            buttons: [
                {
                    text: _t('Proceed'),
                    classes: 'btn btn-primary js_picking_btn_additional',
                    close: true,
                },
                {
                    text: _t('Cancel'),
                    classes: 'btn btn-default',
                    close: true,
                },
            ],
        },
        
    });
    
    /* It provides Stock Picking details form and event handlers
     **/
    snippet_animation.registry.js_picking_form = snippet_animation.Class.extend(mixins.formMixin, {
        
        selector: '.js_picking_form',
        
        start: function() {
            var self = this;
            this.$target.find('.js-picking-form-send').click(function(event) {
                event.preventDefault();
                var complete = true;
                var overpick = false;
                var totalVal = 0.0;
                _.each(self.$target.find('.js-picking-picked-qty'), function(val) {
                    var $val = $(val);
                    if ($val.val()) {
                        var floatVal = parseFloat($val.val());
                        var productQty = parseFloat($val.data('product-qty'));
                        totalVal += floatVal;
                        if (productQty != floatVal) {
                            complete = false;
                            if (productQty < floatVal) {
                                overpick = true;
                            }
                        }
                    }
                });
                if (overpick) {
                    return new ModalOverpick(self.target).open();
                }
                if (totalVal === 0) {
                    if (self.$target.find('.js_picking_pack_op_done').length === 0) {
                        return new ModalImmediate(self.target).open();
                    }
                } else if (complete) {
                    self.handleSubmit(event);
                    return;
                }
                return new ModalBackorder(self.target).open();
            });
            this.$target.find('.js-picking-form-send').click(function(event) {
                self.$target.find('.js_picking_submit_action').val(event.target.value);
            });
            this.$target.submit(function(event) {
                event.preventDefault();
                self.handleSubmit(event);
            });
        },
        
    });

    // Add to Lot button
    var AddLotButton = Widget.extend({
        events: {
            'click' : 'onClick',
        },
        onClick: function(ev){
            ev.preventDefault();
            var self = this;
            //var prod_id = this.$el.attr("data-product-id");
            //var barcode = this.$el.attr("data-barcode");
            //var line_name = this.$el.attr("line-name");
            var op_id = this.$el.attr("op-id");
            var new_line = $('#lot_row').clone();
            var lots_nr = parseInt($('input[name="lots_number"]').val()) + 1;
            //$(new_line).attr("data-product-id", prod_id);
            //$(new_line).attr("data-barcode", barcode);
            //$(new_line).attr("name", line_name);
            $(new_line).removeAttr("id");
            $(new_line).attr("class", 'collapse in pack_lot_'+op_id);
            $(new_line).attr("invisible", '0');
            $(new_line).find('input').each(function(){
                $(this).attr("name", op_id + '.pack_lots_ids.' +$(this).attr("name") + '.' + lots_nr);
            });
            $('input[name="lots_number"]').val(lots_nr)
            $("#new_lot_"+op_id).before(new_line);
        },
    });

    $('a.js_add_lot_line').each(function( index ) {
        var button = new AddLotButton();
        button.setElement($(this)).start();
    });
    
    return {
        ModalBackorder: ModalBackorder,
        ModalImmediate: ModalImmediate,
        ModalOverpick: ModalOverpick,
        PickingForm: snippet_animation.registry.js_picking_form,
    };
    
});
