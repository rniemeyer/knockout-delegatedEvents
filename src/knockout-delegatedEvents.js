;(function(factory) {
    //CommonJS
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        factory(require("knockout"), exports);
        //AMD
    } else if (typeof define === "function" && define.amd) {
        define(["knockout", "exports"], factory);
        //normal script tag
    } else {
        factory(ko, ko.actions = {});
    }
}(function(ko, actions) {
    var prefix = "ko_delegated_", prefixParent = "ko_delegated_parent_";

    function findRoot(callback){
        return  function (originalElement, root, eventName){
            var attr = "data-" + eventName+'-parent';

            while (originalElement && originalElement.nodeType === 1 && !originalElement.disabled && !originalElement.hasAttribute(attr) ) { 
                originalElement = originalElement !== root ? originalElement.parentNode : null;
            }

            if (!originalElement){
                return;
            }

            var dataroot = ko.dataFor(root), clue = originalElement.getAttribute(attr),
                method = clue==='true'? callback : callback[clue];

            if (!!method &&  (typeof method === "function")){
                 return {method:method, element:originalElement, owner:dataroot};
            }
        };
    }

    function methodFinder(originalElement, root, eventName){
        var method, attr = "data-" + eventName, key = prefix + eventName, keyParent = prefixParent+ eventName,
            attrParent = "data-" + eventName+'-parent', owner, parentAttribute, contextelement;

        while (!method && originalElement) {
            if (originalElement.nodeType === 1 && !originalElement.disabled){
                if (parentAttribute){
                    method = ko.utils.domData.get(originalElement, keyParent);
                    if (method){
                        method = parentAttribute==='true'? method : method[parentAttribute];
                        owner = ko.dataFor(originalElement);
                    }
                }
                else{
                    method = (originalElement.getAttribute(attr) || ko.utils.domData.get(originalElement, key));
                    if (!method){
                        parentAttribute =originalElement.getAttribute(attrParent);
                        if (!!parentAttribute) contextelement = originalElement;
                    }
                }    
            }         

            if (!method) {
                originalElement = originalElement !== root ? originalElement.parentNode : null;
            }
        }

        if (method){
            return {method:method, element: contextelement || originalElement, owner:owner};
        }
    }


    var createDelegatedHandler = function(eventName, root, bubble, methodFinderCallBack) {
        return function(event) {

            var res = methodFinderCallBack(event.target || event.srcElement,root,eventName);

            if (!res)
                return;

            var data, context, action, matchingParent, command, result, 
                el = res.element, method = res.method, owner =res.owner;

            if (method) {
                //get context of the element that actually held the action
                context = ko.contextFor(el);

                if (context) {
                    //need to ensure that the clicked element is not inside a disabled element
                    while (el && el !== root) {
                        if (el.disabled) {
                            return;
                        }

                        el = el.parentNode;
                    }

                    data = context.$data;

                    if (typeof method === "string") {
                        //check defined actions
                        if (method in actions) {
                            command = actions[method];
                            if (command) {
                                action = typeof command === "function" ? command : command.action;
                                owner = command.owner || data;
                            }
                        }
                        //search for the action
                        else if (data && data[method] && typeof data[method] === "function") {
                            action = data[method];
                            owner = data;
                        }

                        //search parents for the action
                        if (!action) {
                            matchingParent = ko.utils.arrayFirst(context.$parents, function(parent) {
                                return parent[method] && typeof parent[method] === "function";
                            });

                            action = matchingParent && matchingParent[method];
                            owner = matchingParent;
                        }
                    }
                    //a binding handler was used to associate the element with a function
                    else if (typeof method === "function") {
                        action = method;
                        owner = owner || data;
                    }
                }

                //execute the action as KO normally would
                if (action) {
                    //if the event is a submit event, we want to just pass
                    //the form element, and set the context to 'this'.
                    //This matches the knockout behaviour for submit bindings.
                    if (eventName === "submit") {
                      result = action.call(data, event.target);
                    } else {
                      result = action.call(owner, data, event);
                    }

                    //prevent default action, if handler does not return true
                    if (result !== true) {
                        if (event.preventDefault) {
                            event.preventDefault();
                        }
                        else {
                            event.returnValue = false;
                        }
                    }

                    //prevent bubbling if not enabled
                    if (bubble !== true) {
                        event.cancelBubble = true;

                        if (typeof event.stopPropagation === "function") {
                            event.stopPropagation();
                        }
                    }
                }
            }
        };
    };

    //create binding handler name from event name
    var createBindingName = function(bindingprefix,eventName) {
        return bindingprefix + eventName.substr(0, 1).toUpperCase() + eventName.slice(1);
    };

    var createBinding = function (bindingName,attributeName){
        if (!ko.bindingHandlers[bindingName]) {
            ko.bindingHandlers[bindingName] = {
                init: function(element, valueAccessor) {
                    var action = valueAccessor();
                    ko.utils.domData.set(element, attributeName, action);
                }
            };
        }
    };

    //create a binding for an event to associate a function with the element
    var createDelegatedBinding = function(event) {
        if (!event) {
            return;
        }

        createBinding(createBindingName("delegated",event),prefix + event);
        createBinding(createBindingName("delegatedParent",event),prefixParent + event);
    };

     //add a handler on a parent element that responds to events from the children
    ko.bindingHandlers.delegatedHandler = {
        init: function(element, valueAccessor, allBindings) {
            var events = ko.utils.unwrapObservable(valueAccessor()) || [];

            if (typeof events === "string") {
                events = [events];
            }

            ko.utils.arrayForEach(events, function(event) {
                //check if the associated "delegated<EventName>Bubble" is true (optionally allows bubbling)
                var bubble = allBindings.get(createBindingName("delegated",event + "Bubble")) === true;

                createDelegatedBinding(event);
                ko.utils.registerEventHandler(element, event, createDelegatedHandler(event, element, bubble, methodFinder));
            });
        }
    };

    ko.bindingHandlers.delegatedParentHandler = {
        init: function(element, valueAccessor, allBindings) {
            var events = ko.utils.unwrapObservable(valueAccessor());

            ko.utils.objectForEach (events,function(event) {
                //check if the associated "delegated<EventName>Bubble" is true (optionally allows bubbling)
                var bubble = allBindings.get(createBindingName("delegated",event + "Bubble")) === true;

                ko.utils.registerEventHandler(element, event, createDelegatedHandler(event, element, bubble, findRoot(events[event])));
            });
        }
    };
}));
