Knockout Delegated Events
================
*knockout-delegatedEvents* is a [Knockout.js](http://knockoutjs.com/) plugin that allows you to add event delegation declaratively in your markup in a way that matches well with a normal Knockout application. This means adding an event handler on a parent element that can respond to events triggered by a child element and connect with a handler that lives on the view model. This is similar to using jQuery's [on](http://api.jquery.com/on/) (previously [live](http://api.jquery.com/live/)/[delegate](http://api.jquery.com/delegate/)).

More background here: http://www.knockmeout.net/2012/11/revisit-event-delegation-in-knockout-js.html

##Parent Element

*knockout-delegatedEvents* adds a binding called `delegatedHandler` that you can place on an element to respond to events triggered by its child elements. This binding can go on the `body` or at a lower-level, as necessary. The binding expects either the name of a single event or an array of events that it should handle.

Single event:
```html
<ul data-bind="delegatedHandler: 'click'">
    ...
</ul>
```

Multiple events:
```html
<ul data-bind="delegatedHandler: ['click', 'mouseover', 'mouseout']">
    ...
</ul>
```

##Child Elements

Suppose that we have a simple view model like:

```js
var viewModel = {
    items: ko.observableArray([
        { name: "one" },
        { name: "two" },
        { name: "three" }
    ]),
    removeItem: function(item) {
        this.items.remove(item);
    }
};
```

In our example, we want to indicate that when a child element is clicked it should run the `removeItem` function on our view model. There are three ways to indicate which handler to run when the event is triggered on your element.

###1 - `data-theEventName` attribute matches function by name

The normal way to specify a handler is to add an attribute with the name `data-theEventName` to your child element and supply the name of the function to execute. If you want to respond when the element is clicked, then you would use the `data-click` attribute on the child.

```html
<ul data-bind="delegatedHandler: 'click', foreach: items">
    <li>
        <span data-bind="text: name"></span>
        <a href="#" data-click="removeItem">x</a>
    </li>
</ul>
```

The plugin will attempt to find your handler by looking for a matching function by name on the current data item and then moving up the binding contexts (`$parents` array) to see if it can find a matching name at the next level.  So, in the above example, `removeItem` lives on the `$parent` scope rather than on the actual data item.

With this plugin, you can simply specify `removeItem` and it will locate it on the parent and execute it with the original context (the correct value for `this`, the parent in this case). This means that you have less need to use `var self = this;` or `.bind(this)` to ensure that your handlers are executed with the proper context. The handler will also receive the element's associated data as the first argument and the event object as the second argument to match how Knockout normally executes event handlers.

###2 - `data-theEventName` attribute matches function in `ko.actions`

Another option, besides allowing to the plugin to search for your function by name, is to configure your handler in the `ko.actions` object created by the plugin. There are two ways that actions can be specified:

```js
//pass a function reference or create an anonymous function
ko.actions.removeItem = vm.remove;

//pass a function and indicate the owner (value of `this`) when it runs
ko.actions.removeItem = {
    action: vm.remove,
    owner: vm
};
```

The `ko.actions` item is checked first for a matching method before searching the data item and parents as described in option #1.

There are a couple of situations where this option might be advantageous:

* the method does not live on the data item or one of its parents (could be global)
* there is some ambiguity in the names of methods that you are binding against. Perhaps you have hierarchichal data where each level has a `remove` function and you want to give them more descriptive aliases in `ko.actions`.
* the definition of the handler changes based on application state

Note: if an `owner` is not specified, then the value of `this` will be the current data item, as it would be when using the normal `click` or `event` bindings, so the function would need to be bound properly in your view model.

###3 - Specify a function reference in `delegatedTheEventName` binding

The final option for specifying a handler is to place a normal binding on the child element that stores a reference to the function with the element (but does not attach an event handler). Bindings for each event will be dynamically created, as necessary, by the `delegatedHandler` binding.

For example, you can use the `delegatedClick` binding to associate the element with a specific function.

```html
<ul data-bind="delegatedHandler: 'click', foreach: items">
    <li>
        <span data-bind="text: name"></span>
        <a href="#" data-bind="delegatedClick: $parent.removeItem">x</a>
    </li>
</ul>
```

There are a couple of cases where this technique might be necessary:

* you need to run code that returns a function reference:  `delegatedClick: getMyHandler('someParam')`
* you do not want to use `ko.actions` and have clashing method names or want to use a function that is outside of your view model.

Note: when attaching a handler using the binding, you will need to manage the value of `this` as you would when using the normal `click` and `event` bindings.  So, in this case you would have to take care of it in our view model or bind against it like `$parent.removeItem.bind($parent)`.

##TODO

* Improve example
* Make it easier to configure actions that are dependent on modifiers (control+click, enter key, etc.) without needing to access the event in the view model

##Dependencies

* Knockout 2.0+

##Build
This project uses [grunt](http://gruntjs.com/) for building/minifying.

##Examples
The `examples` directory contains a sample that demonstrates the three different ways that a handler can be found when a child element triggers an event.

View the sample in jsFiddle here: <http://jsfiddle.net/rniemeyer/x57Lv/>

##License
MIT [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)