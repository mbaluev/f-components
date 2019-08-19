(function ($) {
	var methods = {
		activate: function () {
			return this.each(function () {
				$(this).find('[data-toggle="f-menu"]')
					.addBack('[data-toggle="f-menu"]').fMenu();
			});
		},
		init: function (options) {
			return this.each(function () {
				var self = $(this), data = self.data('_f');
				if (!data) {
					self.data('_f', 'menu');
					var that = this.obj = {};
					that.defaults = {
						target: null,
						hidden: true,
						backdrop: false
					};
					that.data = self.data();
					that.options = $.extend(true, {}, that.defaults, that.data, options);
					that.data._initiated = false;
					that.data._source = {
						source: self,
						source_arrow: self.find('.f-icon_animate')
					};
					that.data._twins = {
						twins: null,
						twins_icons: null
					};
					that.data._triggers = {
						show: 'fMenu.show',
						shown: 'fMenu.shown',
						hide: 'fMenu.hide',
						hidden: 'fMenu.hidden'
					};
					that.data._cookieHidden = that.data.target.replace(/[^a-zA-Z0-9_-]/g, '_') + '.hidden';
					that.data._el = {
						menu__backdrop: $('<div class="f-menu__backdrop"></div>')
					};

					/* save widget options to self.data */
					self.data(that.options);

					that.hide = function () {
						$(that.data.target).addClass('f-menu_animation');

						$(that.data.target).off('otransitionend transitionend webkitTransitionEnd');
						$(that.data.target).one('otransitionend transitionend webkitTransitionEnd', function (e) {
							$(this).off(e);
							if (e.target === $(that.data.target)[0]) {
								that.hide_finish();
							}
						});

						that.hide_raw();
						that.set_cookie(true);
					};
					that.hide_raw = function () {
						self.trigger(that.data._triggers.hide, that);
						$('.f-application')
							.addClass('f-' + $(that.data.target).data('id') + '_hidden')
							.removeClass('f-' + $(that.data.target).data('id') + '_shown');
						$(that.data.target).addClass('f-menu_hide');
						$(that.data.target).removeClass('f-menu_opened');
						that.data._twins.twins_icons.removeClass('f-icon_rotate_180deg');
					};
					that.hide_finish = function () {
						$(that.data.target).removeClass('f-menu_animation');
						$(that.data.target).removeClass('f-menu_hide');
						$(that.data.target).addClass('f-menu_hidden');
						$(that.data.target).data('hidden', true);
						self.trigger(that.data._triggers.hidden, that);
						$('[min-width], [max-width]').trigger('fResizeListener.resize');
					};
					that.show = function () {
						$(that.data.target).addClass('f-menu_animation');

						$(that.data.target).off('otransitionend transitionend webkitTransitionEnd');
						$(that.data.target).one('otransitionend transitionend webkitTransitionEnd', function (e) {
							$(this).off(e);
							if (e.target === $(that.data.target)[0]) {
								that.show_finish();
							}
						});

						that.show_raw();
						that.set_cookie(false);
					};
					that.show_raw = function () {
						self.trigger(that.data._triggers.show, that);
						$('.f-application')
							.removeClass('f-' + $(that.data.target).data('id') + '_hidden')
							.addClass('f-' + $(that.data.target).data('id') + '_shown');
						$(that.data.target).addClass('f-menu_open');
						$(that.data.target).removeClass('f-menu_hidden');
						that.data._twins.twins_icons.addClass('f-icon_rotate_180deg');
					};
					that.show_finish = function () {
						$(that.data.target).removeClass('f-menu_animation');
						$(that.data.target).removeClass('f-menu_open');
						$(that.data.target).addClass('f-menu_opened');
						$(that.data.target).data('hidden', false);
						self.trigger(that.data._triggers.shown, that);
						$('[min-width], [max-width]').trigger('fResizeListener.resize');
					};
					that.toggle = function () {
						if ($(that.data.target).data('hidden')) {
							that.show();
						} else {
							that.hide();
						}
					};
					that.toggle_raw = function () {
						if (that.data.hidden) {
							that.hide_raw();
							that.hide_finish();
						} else {
							that.show_raw();
							that.show_finish();
						}
					};

					that.bind = function () {
						self.on('click', that.toggle);
						if (that.data.backdrop) {
							that.data._el.menu__backdrop.on('click', that.toggle);
						}
					};

					that.get_twins = function () {
						that.data._twins.twins = $('[data-toggle="f-menu"][data-target="' + that.data.target + '"]');
						that.data._twins.twins_icons = that.data._twins.twins.find('.f-icon_animate');
					};
					that.get_cookie = function () {
						if ($.cookie(that.data._cookieHidden) != null &&
							typeof $.cookie(that.data._cookieHidden) !== 'undefined') {
							that.data.hidden = JSON.parse($.cookie(that.data._cookieHidden));
						}
					};
					that.set_cookie = function (value) {
						$.cookie(that.data._cookieHidden, '' + value, {path: '/'});
					};

					that.init_menu = function () {
						if (that.data.backdrop) {
							$(that.data.target).after(that.data._el.menu__backdrop);
						}
						that.get_twins();
						that.get_cookie();
						that.toggle_raw();
						that.bind();
					};
					that.init_mobile = function () {
						if (typeof kendo != 'undefined') {
							if (typeof kendo.support.mobileOS == 'object') {
								that.data.hidden = true;
							}
						}
					};
					that.init = function () {
						that.init_mobile();
						that.init_menu();
					};
					that.init();
				}
				return this;
			});
		},
		hide: function () {
			return this.each(function () {
				this.obj.hide();
			});
		},
		show: function () {
			return this.each(function () {
				this.obj.show();
			});
		}
	};
	$.fn.fMenu = function (method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on $.fMenu');
		}
	};
})(jQuery);

// $('body').fMenu('activate')
