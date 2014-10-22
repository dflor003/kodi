module kodi {
    import KodiError = kodi.KodiError;

    describe('KodiError', () => {
        it('should format message', () => {
            // Act
            var error = new KodiError('The quick brown {0} jumped over the lazy {1}', 'foo', 'bar');

            // Assert
            expect(error.message).toBe('Kodi: The quick brown foo jumped over the lazy bar');
        });
    });
} 