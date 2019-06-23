/* created by mbaluev at 2018 */
$.fn.bindFirst = function(name, selector, data, handler) {
    this.on(name, selector, data, handler);
    this.each(function() {
        var handlers = $._data(this, 'events')[name.split('.')[0]];
        var handler = handlers.pop();
        handlers.splice(0, 0, handler);
    });
};
$.fn.closestChild = function(selector) {
    var $found = $(),
        $currentSet = this;
    while ($currentSet.length) {
        $found = $currentSet.filter(selector);
        if ($found.length) break;
        $currentSet = $currentSet.children();
    }
    return $found.first();
};
$.fn.closestChildren = function(selector) {
    var $found = $(),
        $currentSet = this;
    while ($currentSet.length) {
        $found = $currentSet.filter(selector);
        if ($found.length) break;
        $currentSet = $currentSet.children();
    }
    return $found;
};
