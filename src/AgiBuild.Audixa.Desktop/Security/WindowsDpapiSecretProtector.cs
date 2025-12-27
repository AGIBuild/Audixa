using System;
using System.Runtime.Versioning;
using System.Security.Cryptography;
using AgiBuild.Audixa.Persistence;

namespace AgiBuild.Audixa.Desktop.Security;

[SupportedOSPlatform("windows")]
public sealed class WindowsDpapiSecretProtector : ISecretProtector
{
    public byte[] Protect(ReadOnlySpan<byte> plaintext)
    {
        if (!OperatingSystem.IsWindows())
            throw new PlatformNotSupportedException("DPAPI is only available on Windows.");

        return ProtectedData.Protect(plaintext.ToArray(), optionalEntropy: null, scope: DataProtectionScope.CurrentUser);
    }

    public byte[] Unprotect(ReadOnlySpan<byte> protectedData)
    {
        if (!OperatingSystem.IsWindows())
            throw new PlatformNotSupportedException("DPAPI is only available on Windows.");

        return ProtectedData.Unprotect(protectedData.ToArray(), optionalEntropy: null, scope: DataProtectionScope.CurrentUser);
    }
}


