module kodi {
    export interface IDependencyDictionary {
        [name: string]: IMapping;
    }

    export interface IMapping {
        type: DependencyType;
        func: Function;
        dependencies: string[];
    }

    export enum DependencyType {
        None = 0,
        ViewModel = 1,
        Factory = 2,
        Service = 3
    }

    export class KnockoutModule {
        private static reservedNames = { '$data': true };
        private static paramRegex = /function[^(]*\(([^)]*)\)/i;
        private static jsVarNameRegex = /^[a-z_$][a-z0-9_$]*$/i;

        name: string;
        dependencyMapping: IDependencyDictionary = {};

        constructor(name: string) {
            this.checkDependencyName(name);
            this.name = name;
        }

        static getDependencies(func: Function): string[] {
            // Error checks
            if (typeof func !== 'function') {
                throw new KodiError('KnockoutModule.getDependencies: Must pass a function');
            }

            // Check $inject property first
            var explicitDependencies = func['$inject'] || func.prototype['$inject'];
            if (explicitDependencies) {
                return explicitDependencies;
            }

            // Parse dependencies from function arguments
            var stringified = func.toString(),
                matches = stringified.match(KnockoutModule.paramRegex),
                args = matches[1];

            // No params, first param is entire string
            if (!args) {
                return [];
            }

            // Split dependencies and prepare
            var individualArgs = args.split(','),
                dependencies = [];
            for (var i = 0; i < individualArgs.length; i++) {
                dependencies.push(individualArgs[i].trim());
            }

            return dependencies;
        }

        viewmodel(name: string, constructorFunc: Function): KnockoutModule {
            // Error checks
            if (typeof constructorFunc !== 'function') {
                throw new KodiError('KnockoutModule.viewmodel: Must pass a valid constructor function');
            }

            return this.setMapping(name, {
                type: DependencyType.ViewModel,
                func: constructorFunc,
                dependencies: KnockoutModule.getDependencies(constructorFunc)
            });
        }

        factory(name: string, func: Function): KnockoutModule {
            // Error checks
            if (typeof func !== 'function') {
                throw new KodiError('KnockoutModule.factory: Must pass a valid function');
            }

            return this.setMapping(name, {
                type: DependencyType.Factory,
                func: func,
                dependencies: KnockoutModule.getDependencies(func)
            });
        }

        service(name: string, singletonInitializer: Function): KnockoutModule {
            // Error checks
            if (typeof singletonInitializer !== 'function') {
                throw new KodiError('KnockoutModule.factory: Must pass a valid function');
            }

            return this.setMapping(name, {
                type: DependencyType.Service,
                func: singletonInitializer,
                dependencies: KnockoutModule.getDependencies(singletonInitializer)
            });
        }

        private checkDependencyName(name: string): void {
            // Error checks
            if (typeof name !== 'string') {
                throw new KodiError('KnockoutModule: Name must be a string');
            }

            if (!KnockoutModule.jsVarNameRegex.test(name)) {
                throw new KodiError('KnockoutModule: Name must be a valid javascript variable name');
            }

            if (this.dependencyMapping[name]) {
                throw new KodiError('KnockoutModule: A dependency mapping with that name already exists');
            }

            if (name in KnockoutModule.reservedNames) {
                throw new KodiError('KnockoutModule: The name "{0}" is reserved, please choose a different dependency name', name);
            }
        }

        private setMapping(name: string, mapping: IMapping): KnockoutModule {
            // Error checks
            this.checkDependencyName(name);

            // Map in dictionary
            this.dependencyMapping[name] = mapping;
            return this;
        }
    }
}