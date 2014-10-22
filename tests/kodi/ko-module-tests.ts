module kodi {
    import KnockoutModule = kodi.KnockoutModule;
    import DependencyType = kodi.DependencyType;
    import Utils = kodi.common.Utils;

    class TestModel {
        prop1: KnockoutObservable<string>;
        prop2: KnockoutObservable<number>;

        constructor() {
            this.prop1 = ko.observable('foo');
            this.prop2 = ko.observable(42);
        }
    }

    class TestModelWithDependencies {
        constructor(someModel1: any, anotherModel: any) {
        }
    }

    class TestModelWithExplicitDependencies {
        constructor(a: any, b: any) {
        }

        static $inject = ['foo', 'bar'];
    }

    describe('KnockoutModule', () => {
        describe('constructor', () => {
            it('should throw error if name not specified', () => {
                // Assert
                expect(() => new KnockoutModule(null)).toThrowError('Kodi: KnockoutModule: Name must be a string');
            });

            it('should create initial module settings', () => {
                // Act
                var koModule = new KnockoutModule('MyModule');

                // Assert
                expect(koModule.name).toBe('MyModule');
                expect(koModule.dependencyMapping).toEqual({});
            });
        });

        describe('checkDependencyName()', () => {
            var koModule: KnockoutModule,
                nameExistsError = 'Kodi: KnockoutModule: A dependency mapping with that name already exists',
                nameNotAStringError = 'Kodi: KnockoutModule: Name must be a string',
                nameNotValidError = 'Kodi: KnockoutModule: Name must be a valid javascript variable name',
                nameReservedError = 'Kodi: KnockoutModule: The name "{0}" is reserved, please choose a different dependency name',
                checkName: (name: string) => void;

            beforeEach(() => {
                koModule = new KnockoutModule('MyModule');
                checkName = (name: string) => (<any>koModule).checkDependencyName(name);
            });

            it('should throw error if name not valid string', () => {
                // Assert
                expect(() => checkName(null)).toThrowError(nameNotAStringError);
                expect(() => checkName(<any>undefined)).toThrowError(nameNotAStringError);
                expect(() => checkName(<any>42)).toThrowError(nameNotAStringError);
                expect(() => checkName(<any>TestModel)).toThrowError(nameNotAStringError);
            });

            it('should throw error if name not valid JavaScript variable name', () => {
                // Assert
                expect(() => checkName('')).toThrowError(nameNotValidError);
                expect(() => checkName('   ')).toThrowError(nameNotValidError);
                expect(() => checkName('foo bar')).toThrowError(nameNotValidError);
                expect(() => checkName('1foo')).toThrowError(nameNotValidError);
                expect(() => checkName('foo  ')).toThrowError(nameNotValidError);
                expect(() => checkName('   foo')).toThrowError(nameNotValidError);
                expect(() => checkName('1')).toThrowError(nameNotValidError);

                // Test invalid chars
                var invalidChars = ['!', '@', '%', '^', '&', '*', '(', ')', '[', ']', '-', '+', '='];
                invalidChars.forEach((val: string) => expect(() => checkName('foo' + val + 'baz')).toThrowError(nameNotValidError));

                // Valid scenarios
                expect(() => checkName('_foo')).not.toThrowError();
                expect(() => checkName('foo_bar')).not.toThrowError();
                expect(() => checkName('$foo')).not.toThrowError();
                expect(() => checkName('a')).not.toThrowError();
                expect(() => checkName('F00$')).not.toThrowError();
                expect(() => checkName('iPittyAF00')).not.toThrowError();
            });

            it('should throw if a model already defined with given name', () => {
                // Arrange
                koModule
                    .viewmodel('foo', TestModel)
                    .viewmodel('bar', TestModel);

                // Precondition
                expect(koModule.dependencyMapping['foo']).toBeDefined();
                expect(koModule.dependencyMapping['bar']).toBeDefined();

                // Assert
                expect(() => checkName('foo')).toThrowError(nameExistsError);
            });

            it('should throw if name is reserved name', () => {
                // Assert
                expect(() => checkName('$data')).toThrowError(Utils.format(nameReservedError, '$data'));
            });
        });

        describe('viewmodel()', () => {
            var koModule: KnockoutModule;

            beforeEach(() => {
                koModule = new KnockoutModule('MyModule');
            });

            it('should throw error if non function passed', () => {
                // Assert
                expect(() => koModule.viewmodel('myVm', <any>42)).toThrowError('Kodi: KnockoutModule.viewmodel: Must pass a valid constructor function');
            });

            it('should map a viewmodel to the given constructor function', () => {
                // Act
                var result = koModule.viewmodel('myVm', TestModel);

                // Assert
                expect(result).toBe(koModule);
                expect(result.dependencyMapping).not.toBeNull();

                var mapping: IMapping = result.dependencyMapping['myVm'];
                expect(mapping).not.toBeNull();
                expect(mapping.type).toBe(DependencyType.ViewModel);
                expect(mapping.func).toBe(TestModel);
                expect(mapping.dependencies).toEqual([]);
            });

            it('should resolve dependencies for the mapped item via constructor params', () => {
                // Act
                var result = koModule.viewmodel('myVm', TestModelWithDependencies);

                // Assert
                expect(result).not.toBeNull();

                var mapping = result.dependencyMapping['myVm'];
                expect(mapping).toBeDefined();
                expect(mapping.dependencies).toEqual(['someModel1', 'anotherModel']);
            });

            it('should resolve dependencies for the mapped item via $inject property', () => {
                // Act
                var result = koModule.viewmodel('myVm', TestModelWithExplicitDependencies);

                // Assert
                expect(result).not.toBeNull();

                var mapping = result.dependencyMapping['myVm'];
                expect(mapping).toBeDefined();
                expect(mapping.dependencies).toEqual(['foo', 'bar']);
            });
        });

        describe('factory()', () => {
            var koModule: KnockoutModule;

            beforeEach(() => {
                koModule = new KnockoutModule('MyModule');
            });

            it('should throw error if non function passed', () => {
                // Assert
                expect(() => koModule.factory('myFactory', <any>42)).toThrowError('Kodi: KnockoutModule.factory: Must pass a valid function');
            });

            it('should map arbitrary function', () => {
                // Act
                koModule.factory('myFactory', () => {
                    return 42;
                });

                // Assert
                var mapping: IMapping = koModule.dependencyMapping['myFactory'];
                expect(mapping).toBeDefined();
                expect(mapping.type).toBe(DependencyType.Factory);
                expect(typeof mapping.func).toBe('function');
            });
        });

        describe('service()', () => {
            var koModule: KnockoutModule;

            beforeEach(() => {
                koModule = new KnockoutModule('MyModule');
            });

            it('should allow arbitrary function', () => {
                // Act
                koModule.service('myService', () => { return { foo: 'bar' }; });

                // Assert
                var mapping: IMapping = koModule.dependencyMapping['myService'];
                expect(mapping).toBeDefined();
                expect(mapping.type).toBe(DependencyType.Service);
                expect(typeof mapping.func).toBe('function');
            });
        });

        describe('KnockoutModule.getDependencies()', () => {
            it('should throw an error if non function provided', () => {
                // Arrange
                var expectedError = 'Kodi: KnockoutModule.getDependencies: Must pass a function';

                // Assert
                expect(() => KnockoutModule.getDependencies(null)).toThrowError(expectedError);
                expect(() => KnockoutModule.getDependencies(<any>'')).toThrowError(expectedError);
                expect(() => KnockoutModule.getDependencies(<any>42)).toThrowError(expectedError);
                expect(() => KnockoutModule.getDependencies(<any>[])).toThrowError(expectedError);
                expect(() => KnockoutModule.getDependencies(<any>{})).toThrowError(expectedError);
            });

            it('should return empty array when function has no params', () => {
                // Arrange
                var func = () => { alert('foo'); };

                // Act
                var dependencies = KnockoutModule.getDependencies(func);

                // Assert
                expect(dependencies).toEqual([]);
            });

            it('should return single dependency if only one param to function', () => {
                // Arrange
                var func = (message: string) => { console.log(message); };

                // Act
                var dependencies = KnockoutModule.getDependencies(func);

                // Assert
                expect(dependencies).toEqual(['message']);
            });

            it('should parse out dependencies for anonymous functions', () => {
                // Arrange
                var func = (foo: string, ba$r: number, _: Object, Ya_R$: string) => { return () => 42; };

                // Act
                var dependencies = KnockoutModule.getDependencies(func);

                // Assert
                expect(dependencies).toEqual(['foo', 'ba$r', '_', 'Ya_R$']);
            });

            it('should parse out dependencies for named functions', () => {
                // Arrange
                function myFunction(ay: string, bee: string) { return 24; };

                // Act
                var dependencies = KnockoutModule.getDependencies(myFunction);

                // Assert
                expect(dependencies).toEqual(['ay', 'bee']);
            });

            it('should check $inject on function prototype for dependencies if present', () => {
                // Arrange
                function SomeConstructor(a: string, b: string, c: string) {
                    this.a = a;
                    this.b = b;
                    this.c = c;
                }
                SomeConstructor.prototype.$inject = ['$fooService', 'theJawsOfLife', 'penicillin'];

                // Act
                var dependencies = KnockoutModule.getDependencies(SomeConstructor);

                // Assert
                expect(dependencies).toEqual(['$fooService', 'theJawsOfLife', 'penicillin']);
            });

            it('should check $inject on function object for dependencies if present', () => {
                // Arrange
                function SomeConstructor(a: string, b: string, c: string) {
                    this.a = a;
                    this.b = b;
                    this.c = c;
                }
                SomeConstructor['$inject'] = ['$fooService', 'theJawsOfLife', 'penicillin'];

                // Act
                var dependencies = KnockoutModule.getDependencies(SomeConstructor);

                // Assert
                expect(dependencies).toEqual(['$fooService', 'theJawsOfLife', 'penicillin']);
            });
        });
    });
}