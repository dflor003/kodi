/// <reference path="../../typings/knockout/knockout.d.ts" />
/// <reference path="../../typings/jasmine/jasmine.d.ts" />
module kodi {
    import IDependencyDictionary = kodi.IDependencyDictionary;
    import DependencyType = kodi.DependencyType;

    class TestModel {
        prop1: string;
        prop2: number;

        constructor() {
            this.prop1 = 'foo';
            this.prop2 = 42;
        }
    }

    class TestModel2 {
        prop: string;

        constructor() {
            this.prop = 'bar';
        }
    }

    class TestModel3 {
        model2: TestModel2;

        constructor(model2: TestModel2) {
            this.model2 = model2;
        }
    }

    class TestModelWithDependencies {
        model1: TestModel;
        model3: TestModel3;

        constructor(model1: TestModel, model3: TestModel3) {
            this.model1 = model1;
            this.model3 = model3;
        }
    }

    class TestModelWithReusedDependencies {
        model2: TestModel2;
        model3: TestModel3;

        constructor(model2: TestModel2, model3: TestModel3) {
            this.model2 = model2;
            this.model3 = model3;
        }
    }

    describe('DependencyResolver', () => {

        describe('constructor()', () => {
            it('should throw error if no dependencies passed', () => {
                // Assert
                expect(() => new DependencyResolver(null)).toThrowError('Kodi: DependencyResolver: No dependency dictionary passed');
            });
        });

        describe('resolve()', () => {
            var resolver: DependencyResolver,
                mappings: IDependencyDictionary,
                mapModel: (name: string, model: Function, ...deps: string[]) => void,
                mapFactory: (name: string, factory: Function, ...deps: string[]) => void;

            beforeEach(() => {
                mappings = {};
                resolver = new DependencyResolver(mappings);
                mapModel = (name: string, model: Function, ...deps: string[]) => {
                    mappings[name] = {
                        type: DependencyType.ViewModel,
                        func: model,
                        dependencies: deps
                    };
                };
                mapFactory = (name: string, factory: Function, ...deps: string[]) => {
                    mappings[name] = {
                        type: DependencyType.Factory,
                        func: factory,
                        dependencies: deps
                    };
                };
            });

            it('should throw error when no matching dependency', () => {
                // Assert
                expect(() => resolver.resolve('iDontExist')).toThrowError('Kodi: DependencyResolver: The dependency "iDontExist" could not be resolved');
            });

            it('should throw error if no name passed', () => {
                // Assert
                expect(() => resolver.resolve(null)).toThrowError('Kodi: DependencyResolver: No dependency name passed');
            });

            it('should throw error if circular dependency found', () => {
                // Arrange
                mapModel('foo', () => { }, 'bar');
                mapModel('bar', () => { }, 'baz');
                mapModel('baz', () => { }, 'foo');

                // Assert
                expect(() => resolver.resolve('foo')).toThrowError('Kodi: DependencyResolver: There was a circular reference in the dependency chain: foo -> bar -> baz -> foo');
            });

            describe('when resolving view model dependencies', () => {
                it('should invoke view model with "new" keyword to create instance', () => {
                    // Arrange
                    mapModel('myModel', TestModel);

                    // Act
                    var instance = resolver.resolve<TestModel>('myModel');

                    // Assert
                    expect(instance).toBeDefined();
                    expect(instance instanceof TestModel).toBe(true);
                    expect(instance.prop1).toBe('foo');
                    expect(instance.prop2).toBe(42);
                });

                it('should resolve simple dependency chain', () => {
                    // Arrange
                    mapModel('myModel', TestModelWithDependencies, 'model1', 'model3');
                    mapModel('model1', TestModel);
                    mapModel('model2', TestModel2);
                    mapModel('model3', TestModel3, 'model2');

                    // Act
                    var instance = resolver.resolve<TestModelWithDependencies>('myModel');

                    // Assert
                    expect(instance).toBeDefined();
                    expect(instance instanceof TestModelWithDependencies).toBe(true);
                    expect(instance.model1.prop1).toBe('foo');
                    expect(instance.model1.prop2).toBe(42);
                    expect(instance.model3.model2.prop).toBe('bar');
                });

                it('should reuse already created instances of classes if more than one class depend on them', () => {
                    // Arrange
                    mapModel('myModel', TestModelWithReusedDependencies, 'model2', 'model3');
                    mapModel('model2', TestModel2);
                    mapModel('model3', TestModel3, 'model2');

                    // Act
                    var instance = resolver.resolve<TestModelWithReusedDependencies>('myModel');

                    // Assert
                    expect(instance).toBeDefined();
                    expect(instance instanceof TestModelWithReusedDependencies).toBe(true);
                    expect(instance.model2).toBe(instance.model3.model2);
                });
            });

            describe('when resolving factory dependencies', () => {
                it('should invoke function with given args and default context', () => {
                    // Arrange
                    var myInstance = {},
                        factory = jasmine.createSpy('factory');
                    mapFactory('myFactory', factory);
                    factory.and.callFake(() => myInstance);

                    // Act
                    var instance = resolver.resolve('myFactory');

                    // Assert
                    expect(instance).toBe(myInstance);
                    expect(factory).toHaveBeenCalled();
                });
            });
        });
    });
}