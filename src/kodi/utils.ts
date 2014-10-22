module kodi.common {
    export class Utils {
        static format(message: string, args: any[]): string;
        static format(message: string, ...args: any[]): string;
        static format(message: string, args: any): string {
            if (arguments.length <= 1) {
                return message;
            }

            var formatArgs = [];
            if (arguments.length === 2 && args && args.push) {
                formatArgs = args;
            } else if (arguments.length >= 2) {
                for (var j = 0; j < arguments.length - 1; j++) {
                    formatArgs[j] = arguments[j + 1];
                }
            }

            for (var i = 0; i < formatArgs.length; i++) {
                var stringVal = formatArgs[i] === null
                    ? 'null'
                    : typeof formatArgs[i] === 'undefined'
                    ? 'undefined'
                    : formatArgs[i].toString();

                message = message.replace('{' + i + '}', stringVal);
            }

            return message;
        }
    }
}