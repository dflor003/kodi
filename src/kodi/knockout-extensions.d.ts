/// <reference path="../../typings/knockout/knockout.d.ts" />
/* tslint:disable */
interface KnockoutStatic {
    applyBindingsWithInjection(moduleName: string, viewModelName: string, dataContext: any, rootNode?: EventTarget): void;
    module(moduleName: string): kodi.KnockoutModule;
}