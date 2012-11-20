describe("knockout-delegatedEvents", function(){
    var defaultAction = function(item) {
        this.called = true;
        this.item = item;
    };

    it("should create ko.actions", function() {
        expect(ko.actions).toBeDefined();
    });

    describe("delegatedHandler binding", function() {
        it("should create the binding", function() {
            expect(ko.bindingHandlers.delegatedHandler).toBeDefined();
        });

        describe("creating child binding for specified event", function() {
            it("should create a binding for the event passed to it", function() {
                var div = document.createElement("div");
                div.setAttribute("data-bind", "delegatedHandler: 'one'");
                ko.applyBindings({}, div);
                expect(ko.bindingHandlers.delegatedOne).toBeDefined();
                delete ko.bindingHandlers.one;
            });
        });

        describe("creating child bindings for specified events from an array", function() {
            beforeEach(function() {
                var div = document.createElement("div");
                ko.bindingHandlers.delegatedTwo = "test";
                div.setAttribute("data-bind", "delegatedHandler: ['one', 'handler', 'three']");
                ko.applyBindings({}, div);
            });

            it("should create a binding for an event passed to it", function() {
                expect(ko.bindingHandlers.delegatedOne).toBeDefined();
            });

            it("should create a binding when one exists already", function() {
                expect(ko.bindingHandlers.delegatedTwo).toEqual("test");
            });

            it("should create a binding for each event in the array", function() {
                expect(ko.bindingHandlers.delegatedThree).toBeDefined();
            });

            afterEach(function() {
                delete ko.bindingHandlers.one;
                delete ko.bindingHandlers.two;
                delete ko.bindingHandlers.three;
            });
        });

        describe("handling events when element has child binding", function() {
            var root, parent, child;

            beforeEach(function() {
                delete ko.actions.myAction;
                root = document.createElement("div");
                parent = document.createElement("div");
                child = document.createElement("div");

                root.appendChild(parent);
                parent.appendChild(child);
                document.body.appendChild(root);

                root.setAttribute("data-bind", "delegatedHandler: ['click']");
                parent.setAttribute("data-bind", "delegatedClick: myAction");
            });

            describe("when action is on the data item", function() {
                var vm;

                beforeEach(function() {
                    vm = {
                        myAction: defaultAction
                    };

                    ko.applyBindings(vm, root);
                });

                it("should find and execute a method", function() {
                    ko.utils.triggerEvent(parent, "click");

                    expect(vm.called).toBeTruthy();
                    expect(vm.item).toEqual(vm);
                });

                it("should find and execute a method when parent has action and a child is clicked", function() {
                    ko.utils.triggerEvent(child, "click");

                    expect(vm.called).toBeTruthy();
                    expect(vm.item).toEqual(vm);
                });
            });

            describe("when method is on the item's parent", function() {
                it("should find and execute a method", function() {
                    var vm = {
                        myAction: defaultAction,
                        child: {}
                    };

                    parent.setAttribute("data-bind", "with: child");
                    child.setAttribute("data-bind", "delegatedClick: $root.myAction");

                    ko.applyBindings(vm, root);
                    ko.utils.triggerEvent(child, "click");

                    expect(vm.child.called).toBeTruthy();
                    expect(vm.child.item).toEqual(vm.child);
                });
            });
        });

        describe("handling events when element uses data-eventName", function() {
            var root, parent, child;

            beforeEach(function() {
                delete ko.actions.myAction;
                root = document.createElement("div");
                parent = document.createElement("div");
                child = document.createElement("div");

                root.appendChild(parent);
                parent.appendChild(child);
                document.body.appendChild(root);

                root.setAttribute("data-bind", "delegatedHandler: ['click']");
                parent.setAttribute("data-click", "myAction");
            });

            describe("when method is in ko.actions", function() {
                it("should find and execute a method when configured as function", function() {
                    var vm = {};

                    ko.actions.myAction = defaultAction;

                    ko.applyBindings(vm, root);
                    ko.utils.triggerEvent(parent, "click");

                    expect(vm.called).toBeTruthy();
                    expect(vm.item).toEqual(vm);
                });

                it("should find an execute a method when configured as options object", function() {
                    var vm = {},
                        owner = {};

                    ko.actions.myAction = {
                        action: defaultAction,
                        owner: owner
                    };

                    ko.applyBindings(vm, root);
                    ko.utils.triggerEvent(parent, "click");

                    expect(owner.called).toBeTruthy();
                    expect(owner.item).toEqual(vm);
                    expect(vm.called).toBeUndefined();
                });
            });

            describe("when method is on the data item", function() {
                var vm;

                beforeEach(function() {
                    vm = {
                        myAction: defaultAction
                    };

                    ko.applyBindings(vm, root);
                });

                it("should find and execute a method", function() {
                    ko.utils.triggerEvent(parent, "click");

                    expect(vm.called).toBeTruthy();
                    expect(vm.item).toEqual(vm);
                });

                it("should find and execute a method when parent has action and a child is clicked", function() {
                    ko.utils.triggerEvent(child, "click");

                    expect(vm.called).toBeTruthy();
                    expect(vm.item).toEqual(vm);
                });
            });

            describe("when method is on the item's parent", function() {
                it("should find and execute a method", function() {
                    var vm = {
                        myAction: defaultAction,
                        child: {}
                    };

                    parent.setAttribute("data-bind", "with: child");
                    child.setAttribute("data-click", "myAction");

                    ko.applyBindings(vm, root);
                    ko.utils.triggerEvent(child, "click");

                    expect(vm.called).toBeTruthy();
                    expect(vm.item).toEqual(vm.child);
                });
            });

            describe("when the method can't be found", function() {
                it("should not throw an error", function() {
                    var vm = {};

                    ko.applyBindings(vm, root);
                    ko.utils.triggerEvent(parent, "click");

                    expect(vm.called).toBeUndefined();
                });
            });
        });
    });
});