using System;

namespace AgiBuild.Audixa.Persistence;

public sealed class ThrowingSecretProtector : ISecretProtector
{
    private readonly string _message;

    public ThrowingSecretProtector(string? message = null)
    {
        _message = message ?? "Secure secret storage is not configured for this platform.";
    }

    public byte[] Protect(ReadOnlySpan<byte> plaintext) =>
        throw new NotSupportedException(_message);

    public byte[] Unprotect(ReadOnlySpan<byte> protectedData) =>
        throw new NotSupportedException(_message);
}


