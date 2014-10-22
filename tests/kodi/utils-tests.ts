module kodi.common {
    import Utils = kodi.common.Utils;

    describe('Utils', () => {
        describe('format', () => {
            it('should translate null object to "null" string', () => {
                // Act
                var result = Utils.format('The value is "{0}"', null);

                // Assert
                expect(result).toBe('The value is "null"');
            });

            it('should translate undefined object to "undefined" string', () => {
                // Act
                var result = Utils.format('The value is "{0}"', undefined);

                // Assert
                expect(result).toBe('The value is "undefined"');
            });

            it('should format string if passed variable number of args', () => {
                // Act
                var result = Utils.format('Some message "{0}" with multiple args: {1}, {2}', 'foo', 42, 24);

                // Assert
                expect(result).toBe('Some message "foo" with multiple args: 42, 24');
            });

            it('should format string if passed array of arguments', () => {
                // Act
                var result = Utils.format('Another "{0}" message with args: {1}, {2}', ['bar', 867, 5309]);

                // Assert
                expect(result).toBe('Another "bar" message with args: 867, 5309');
            });
        });
    });
}