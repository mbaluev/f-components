(function ($) {
	var methods = {
		activate: function () {
			return this.each(function () {
				$(this).find('[data-toggle="f-tab"]').addBack('[data-toggle="f-tab"]').on('click', function (e, data) {
					if (!data) {
						data = $(this).data('bubble');
					}
					$('[data-toggle="f-popup"]').fPopup({_visible: true});
					$(e.currentTarget).fTab();
					$(e.currentTarget).fTab('select', data);
				});

				$(this).find('[data-toggle="f-tab"][data-active="true"]')
					.addBack('[data-toggle="f-tab"][data-active="true"]').trigger('click', false);

				$(this).find('[data-toggle="f-tab"][href="#' + fUrl.parseHash(0) + '"]')
					.addBack('[data-toggle="f-tab"][href="#' + fUrl.parseHash(0) + '"]').trigger('click', false);
			});
		},
		init: function (options) {
			return this.each(function () {
				var self = $(this); var data = self.data('_f');
				if (!data) {
					var that = this.obj = {};
					that.defaults = {
						active: false,
						disabled: false,
						animation: true,
						highlight: true
					};
					that.data = self.data();
					that.options = $.extend(true, {}, that.defaults, that.data, options);
					that.data._source = self;
					that.data._target = null;
					that.data._neighbors = [];
					that.data._initiating = false;
					that.data._initiated = false;
					that.data._cnt = -1;
					that.data._twins = {
						twins: null
					};
					that.data._parent = null;
					that.data._triggers = {
						show: 'fTab.show',
						shown: 'fTab.shown',
						hide: 'fTab.hide',
						hidden: 'fTab.hidden',
						load: 'fTab.load',
						loaded: 'fTab.loaded'
					};

					/* save widget options to self.data */
					self.data(that.options);

					that.select = function (bubble) {
						that.hide_neighbors();
						that.show_target();
						that.show_twins();
						if (bubble) {
							that.show_parent();
						}
					};
					that.hide_neighbors = function () {
						that.data._neighbors.forEach(function (tab) {
							if (that.data.highlight) {
								tab.removeClass('f_active');
							}
							if (tab.data().active) {
								tab.data()._source.trigger(that.data._triggers.hide, tab.data());
							}
							tab.data()._target.removeClass('f-tab__panel_animation');
							tab.data()._target.removeClass('f-tab__panel_visible');
							tab.data()._target.addClass('f-tab__panel_hidden');
							if (tab.data().active) {
								tab.data()._source.trigger(that.data._triggers.hidden, tab.data());
							}
							tab.data().active = false;
							tab.data().disabled = false;
						});
					};
					that.show_target = function () {
						that.data._cnt++;
						that.data._source.trigger(that.data._triggers.show, that.data);
						if (that.data._cnt === 0) {
							that.data._source.trigger(that.data._triggers.load, that.data);
						}
						if (that.data.animation) {
							that.data._target.addClass('f-tab__panel_animation');
						}
						if (that.data.highlight) {
							that.data._source.addClass('f_active');
						}
						that.data.active = true;
						that.data.disabled = true;

						that.data._target.off('oanimationend animationend webkitAnimationEnd');
						that.data._target.one('oanimationend animationend webkitAnimationEnd', function (e) {
							$(this).off(e);
							that.data._target.removeClass('f-tab__panel_animation');
							that.data._source.trigger(that.data._triggers.shown, that.data);
							if (that.data._cnt === 0) {
								that.data._source.trigger(that.data._triggers.loaded, that.data);
							}
						});

						that.data._target.removeClass('f-tab__panel_hidden');
						that.data._target.addClass('f-tab__panel_visible');
						that.data._target.find('[min-width], [max-width]').trigger('fResizeListener.resize');
					};
					that.show_twins = function () {
						that.data._twins.twins.each(function (){
							if ($(this).data('highlight')) {
								$(this).addClass('f_active');
							}
						});
					};
					that.show_parent = function () {
						if (that.data._parent.length > 0) {
							if (!that.data._parent.data('active')) {
								if (!that.data._parent.data('_initiated')) {
									that.data._parent.fTab();
								}
								that.data._parent.fTab('select');
							}
						}
					};

					that.get_neighbors = function () {
						$('[data-toggle="f-tab"][data-tab-group="' + self.data('tab-group') + '"]').each(function () {
							if ($(this).attr('href') != that.data._source.attr('href')) {
								var tab = $(this);
								if (!tab.data('_initiated') && !tab.data('_initiating')) {
									tab.fTab();
								}
								that.data._neighbors.push(tab);
							}
						});
					};
					that.get_twins = function () {
						that.data._twins.twins = $('[data-toggle="f-tab"][data-tab-group="' + self.data('tab-group') + '"][href="' + self.attr('href') + '"]');
					};
					that.get_parent = function () {
						that.data._parent = $('[data-toggle="f-tab"][href="#' + self.data('tab-group') + '"]');
					};

					that.init_tab = function () {
						that.data._initiating = true;
						that.get_neighbors();
						that.get_twins();
						that.get_parent();
						that.data._target = $(self.attr('href'));
						that.data._initiated = true;
						that.data._initiating = false;
					};
					that.init = function () {
						if (!that.data._initiated) {
							that.init_tab();
						}
					};
					that.init();
				}
				return this;
			});
		},
		select: function (bubble) {
			return this.each(function () {
				this.obj.select(bubble);
			});
		}
	};
	$.fn.fTab = function (method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on $.fTab');
		}
	};
})(jQuery);

// $('body').fTab('activate')
