module kodi {
    import IDependencyDictionary = kodi.IDependencyDictionary;
    import DependencyType = kodi.DependencyType;
    import KodiError = kodi.KodiError;

    interface IResolvedInstanceDictionary {
        [key: string]: any;
    }

    export class DependencyResolver {
        private mappings: IDependencyDictionary;

        constructor(mappings: IDependencyDictionary) {
            // Error checks
            if (!mappings) {
                throw new KodiError('DependencyResolver: No dependency dictionary passed');
            }

            this.mappings = mappings;
        }

        resolve<TModel>(name: string): TModel {
            return this.__resolve(name, {}, []);
        }

        private __resolve(name: string, currentResolved: IResolvedInstanceDictionary, currentDependencyChain: string[]): any {
            // Error checks
            if (typeof name !== 'string') {
                throw new KodiError('DependencyResolver: No dependency name passed');
            }

            if (!this.mappings[name]) {
                throw new KodiError('DependencyResolver: The dependency "{0}" could not be resolved', name);
            }

            if (currentDependencyChain.indexOf(name) !== -1) {
                throw new KodiError('DependencyResolver: There was a circular reference in the dependency chain: {0}', currentDependencyChain.concat(name).join(' -> '));
            }

            // If dependency already resolved, just return it
            if (currentResolved[name]) {
                return currentResolved[name];
            }

            // Get relevant values
            var entry = this.mappings[name],
                type = entry.type,
                dependencies = entry.dependencies,
                func: any = entry.func;

            // Resolve children
            currentDependencyChain.push(name);
            var args = dependencies.map((dep: string) => this.__resolve(dep, currentResolved, currentDependencyChain));
            currentDependencyChain.pop();

            // Resolve result depending on type of dependency
            var result: any;
            switch(type) {
                case DependencyType.ViewModel:
                    result = this.createInstance(func, args);
                    break;
                case DependencyType.Factory:
                    result = func.apply(null, args);
                    break;
                default:
                    throw new KodiError('DependencyResolver: Error creating instance of dependency with name "{0}"', name);
            }
            currentResolved[name] = result;

            return result;
        }

        private createInstance(func: any, args: any[]): any {
            var temp: any = () => { };
            temp.prototype = func.prototype;

            var instance = new temp,
                result = func.apply(instance, args);

            return Object(result) === result ? result : instance;
        }
    }
}