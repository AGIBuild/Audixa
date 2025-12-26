using System;

namespace AgiBuild.Audixa.Tests.TestSupport;

internal sealed class ManualTimeProvider : TimeProvider
{
    private DateTimeOffset _utcNow;

    public ManualTimeProvider(DateTimeOffset utcNow)
    {
        _utcNow = utcNow;
    }

    public void SetUtcNow(DateTimeOffset utcNow) => _utcNow = utcNow;

    public override DateTimeOffset GetUtcNow() => _utcNow;

    public override long GetTimestamp() => _utcNow.UtcTicks;
}


