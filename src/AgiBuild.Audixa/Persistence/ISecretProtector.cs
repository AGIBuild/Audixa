using System;

namespace AgiBuild.Audixa.Persistence;

public interface ISecretProtector
{
    byte[] Protect(ReadOnlySpan<byte> plaintext);
    byte[] Unprotect(ReadOnlySpan<byte> protectedData);
}


