module kodi {
    import Utils = kodi.common.Utils;

    export class KodiError implements Error {
        message: string;
        name: string;

        constructor(message: string, ...args: any[]) {
            Error.call(this, 'Kodi: ' + Utils.format(message, args));
            this.message = 'Kodi: ' + Utils.format(message, args);
        }
    }

    KodiError.prototype = new Error();
}