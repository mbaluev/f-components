(function ($) {
	var methods = {
		activate: function () {
			return this.each(function () {
				$(this).find('[min-width],[max-width]')
					.addBack('[min-width],[max-width]').fResizeListener()
					.trigger('fResizeListener.resize');
			});
		},
		init: function (options) {
			return this.each(function () {
				var self = $(this); var data = self.data('_resize');
				if (!data) {
					var that = this.obj = {};
					that.defaults = {};
					that.data = self.data();
					that.options = $.extend(true, {}, that.defaults, that.data, options);
					that.data._sizes = ['500px', '768px', '1024px', '1280px', '1440px']; //['34em', '48em', '62em', '76em'];
					that.data._modes = [];
					that.data._cnt = 0;
					that.data._triggers = {
						resize: 'fResizeListener.resize'
					};

					/* save widget options to self.data */
					self.data(that.options);

					that.getModes = function () {
						if (typeof self.attr('min-width') != 'undefined') {
							if ($.inArray('min-width', that.data._modes) < 0) {
								that.data._modes.push('min-width');
							}
						}
						if (typeof self.attr('max-width') != 'undefined') {
							if ($.inArray('max-width', that.data._modes) < 0) {
								that.data._modes.push('max-width');
							}
						}
					};
					that.getEmSize = function (element) {
						if (!element) {
							element = document.documentElement;
						}
						var fontSize = window.getComputedStyle(element, null).fontSize;
						return parseFloat(fontSize) || 16;
					};
					that.getElementSize = function (element) {
						if (!element.getBoundingClientRect) {
							return {
								width: element.offsetWidth,
								height: element.offsetHeight
							};
						}
						var rect = element.getBoundingClientRect();
						return {
							width: Math.round(rect.width),
							height: Math.round(rect.height)
						};
					};
					that.convertToPx = function (element, value) {
						var numbers = value.split(/\d/);
						var units = numbers[numbers.length - 1];
						value = parseFloat(value);
						switch (units) {
							case 'px':
								return value;
							case 'em':
								return value * that.getEmSize(element);
							case 'rem':
								return value * that.getEmSize();
								// Viewport units!
								// According to http://quirksmode.org/mobile/tableViewport.html
								// documentElement.clientWidth/Height gets us the most reliable info
							case 'vw':
								return value * document.documentElement.clientWidth / 100;
							case 'vh':
								return value * document.documentElement.clientHeight / 100;
							case 'vmin':
							case 'vmax':
								var vw = document.documentElement.clientWidth / 100;
								var vh = document.documentElement.clientHeight / 100;
								var chooser = Math[units === 'vmin' ? 'min' : 'max'];
								return value * chooser(vw, vh);
							default:
								return value;
                            // for now, not supporting physical units (since they are just a set number of px)
                            // or ex/ch (getting accurate measurements is hard)
						}
					};
					that.setupInformation = function () {
						if (self[0].offsetParent) {
							that.data._modes.forEach(function (_mode) {
								var attrValue = '';
								that.data._sizes.forEach(function (_size) {
									var value = that.convertToPx(null, _size);
									var size = that.getElementSize(self[0]);
									if (_mode === 'min-width' && size.width >= value) {
										attrValue += _size + ' ';
									}
									if (_mode === 'max-width' && size.width <= value) {
										attrValue += _size + ' ';
									}
								});
								self.attr(_mode, attrValue);
							});
							that.data._cnt++;
						}
					};
					that.bind = function () {
						$(window).resize(that.setupInformation);
						self.on(that.data._triggers.resize, function (e) {
							if (e.target === self[0]) {
								that.setupInformation();
							}
						});
					};
					that.init = function () {
						that.getModes();
						that.bind();
					};
					that.init();
				}
				return this;
			});
		},
		method: function () {
			return this.each(function () {
				this.obj.method();
			});
		}
	};
	$.fn.fResizeListener = function (method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on $.fResizeListener');
		}
	};
})(jQuery);

// $('body').fResizeListener('activate')
