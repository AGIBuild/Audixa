using System;

namespace AgiBuild.Audixa.Infrastructure;

internal static class TimeProviderExtensions
{
    public static DateTimeOffset GetUtcNowOffset(this TimeProvider timeProvider)
    {
        // TimeProvider provides DateTimeOffset in UTC via GetUtcNow().
        return timeProvider.GetUtcNow();
    }
}


