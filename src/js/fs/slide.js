(function ($) {
	var methods = {
		activate: function () {
			return this.each(function () {
				$(this).find('[data-toggle="f-slide"]').addBack('[data-toggle="f-slide"]').on('click', function (e) {
					$(e.currentTarget).fSlide(e.data);
				});
				$(this).find('[data-f-slide="true"]').fSlide();
			});
		},
		init: function (options) {
			return this.each(function () {
				var self = $(this), data = self.data('_f');
				if (!data) {
					var that = this.obj = {};
					that.defaults = {
						animation: true,
						target: null
					};
					that.data = self.data();
					that.options = $.extend(true, {}, that.defaults, that.data, options);
					that.data._source = {
						source: self,
						source_arrow: self.find('.f-icon_animate')
					};
					that.data._slide = {
						slide: $(that.data.target).addClass('f-slide'),
						height: $(that.data.target).outerHeight()
					};
					that.data._triggers = {
						show: 'fsSlide.show',
						shown: 'fsSlide.shown',
						hide: 'fsSlide.hide',
						hidden: 'fsSlide.hidden'
					};

					/* save widget options to self.data */
					self.data(that.options);

					that.toggle = function () {
						if (that.data._visible) {
							that.hide();
						} else {
							that.show();
						}
					};
					that.hide = function () {
						self.trigger(that.data._triggers.hide, that);
						that.data._source.source.removeClass('f-slide_selected');
						that.data._slide.slide.slideUp(100, function () {
							that.data._slide.slide.addClass('f-slide_hidden');
						});
						if (typeof that.data._source.source_arrow[0] !== 'undefined') {
							that.data._source.source_arrow.removeClass('f-icon_rotate_90deg');
						}
						if (that.data.animation) {
							that.data._slide.slide.off('otransitionend transitionend webkitTransitionEnd');
							that.data._slide.slide.one('otransitionend transitionend webkitTransitionEnd', function (e) {
								$(this).off(e);
								self.trigger(that.data._triggers.hidden, that);
							});
						} else {
							self.trigger(that.data._triggers.hidden, that);
						}
						that.data._visible = false;
					};
					that.show = function () {
						self.trigger(that.data._triggers.show, that);
						that.data._source.source.addClass('f-slide_selected');
						that.data._slide.slide.slideDown(100, function () {
							that.data._slide.slide.removeClass('f-slide_hidden');
						});
						if (typeof that.data._source.source_arrow[0] !== 'undefined') {
							that.data._source.source_arrow.addClass('f-icon_rotate_90deg');
						}
						if (that.data.animation) {
							that.data._slide.slide.one('otransitionend transitionend webkitTransitionEnd', function (e) {
								$(this).off(e);
								self.trigger(that.data._triggers.shown, that);
							});
						} else {
							self.trigger(that.data._triggers.shown, that);
						}
						that.data._visible = true;
					};

					that.init = function () {
						if (!that.data._initiated) {
							if (that.data.animation) {
								that.data._slide.slide.addClass('f-slide_animation');
							}
							that.data._visible = false;
							that.data._initiated = true;
						}
						that.toggle();
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
	$.fn.fSlide = function (method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on $.fSlide');
		}
	};
})(jQuery);

// $('body').fSlide('activate')
