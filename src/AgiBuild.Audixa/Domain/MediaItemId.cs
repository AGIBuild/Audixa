using System;
using System.Security.Cryptography;
using System.Text;

namespace AgiBuild.Audixa.Domain;

public static class MediaItemId
{
    public static string From(MediaSourceKind kind, string sourceLocator)
    {
        var input = $"{(int)kind}:{sourceLocator}";
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = SHA256.HashData(bytes);

        // 20 hex chars (80 bits) is stable and short enough for UI/debugging.
        return Convert.ToHexString(hash.AsSpan(0, 10)).ToLowerInvariant();
    }
}


