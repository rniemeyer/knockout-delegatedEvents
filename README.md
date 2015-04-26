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

This option for specifying a handler is to place a normal binding on the child element that stores a reference to the function with the element (but does not attach an event handler). Bindings for each event will be dynamically created, as necessary, by the `delegatedHandler` binding.

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

###4 - Specify a function reference in `delegatedFatherTheEventName` binding and use `data-TheEventName-father` attribute

The final option for specifying a handler is to place a normal binding on the father element that stores a reference to the function with the element (but does not attach an event handler). A `data-TheEventName-father` attribute should be added to the element that should respond to the event. Exactly as for `delegateTheEventName`, bindings for each event will be dynamically created, as necessary, by the `delegatedHandler` binding.
It is possible to handle mutiple child elements in a single father element using object literal as `delegatedFatherTheEventName` binding where keys should be used as `data-TheEventName-father` attribute values and values should be the handler. Otherwise the `data-TheEventName-father` value should be set to true and `delegatedFatherClick` value should be the handler.

For example, you can use the `delegatedFatherClick` binding to associate the element with a specific function.

```html
<ul data-bind="delegatedHandler: 'click', foreach: items, delegatedFatherClick:removeItem">
    <li>
        <span data-bind="text: name"></span>
        <a href="#" data-click-father="true">x</a>
    </li>
</ul>
``` 

Here is an example how you can use the `delegatedFatherClick` binding to associate multiple elements with diferent functions.

```html
<ul data-bind="delegatedHandler: 'click', foreach: items, delegatedFatherClick:{remove:removeItem,add:AddItem}">
    <li>
        <span data-bind="text: name"></span>
        <a href="#" data-click-father="removeItem">x</a>
        <a href="#" data-click-father="AddItem">+/a>
    </li>
</ul>
``` 
When the element with the `delegatedFatherTheEventName` binding and the element that should attach the event handler are the same, it is possible to use `delegatedFatherHandler` binding instead to simplify notation. This binding receive a value of: {EventName:function,....} associated with `data-click-father` set to true on child element or {EventName:{KeyOne:functionOne, KeyTwo:FunctionTwo...},...} associated with `data-click-father` set to KeyOne and KeyTwo on child elements.

For example, you can re-write preceding example using `delegatedFatherHandler` like this:

```html
<ul data-bind="foreach: items, delegatedFatherHandler:{click:{remove:removeItem,add:AddItem}}">
    <li>
        <span data-bind="text: name"></span>
        <a href="#" data-click-father="removeItem">x</a>
        <a href="#" data-click-father="AddItem">+/a>
    </li>
</ul>
``` 

This technique gives you the power of solution 3 and at the same time you will pay the overhead of parsing and executing a binding only on father element and not on all child elements.

##Control Bubbling
Normally, when an event is handled, the plugin will prevent further bubbling of the event. In a scenario that you do want an event to continue bubbling, you can add an additional binding per event name to allow bubbling.

```html
<div data-bind="delegatedHandler: ['click', 'mouseover'], delegatedClickBubble: true">
...
</div>
```

In this caase, the `delegatedClickBubble` additional binding will signal the plugin that when it handles a `click` event it should allow the event to continue bubbling. For even greater control, the handler could then access the event argument (2nd arg) and choose to prevent bubbling on a case-by-case basis.

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
