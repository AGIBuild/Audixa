using System;
using System.Runtime.Versioning;
using AgiBuild.Audixa.Persistence;
using Android.Security.Keystore;
using Java.Security;
using Javax.Crypto;
using Javax.Crypto.Spec;

namespace AgiBuild.Audixa.Android.Platform;

[SupportedOSPlatform("android23.0")]
public sealed class AndroidKeystoreSecretProtector : ISecretProtector
{
    private const string KeyStoreName = "AndroidKeyStore";
    private const string KeyAlias = "audixa.secrets.aesgcm.v1";

    // Binary format:
    // [0] version (1)
    // [1] iv length (N)
    // [2..2+N) iv
    // [2+N..] ciphertext (includes auth tag)
    public byte[] Protect(ReadOnlySpan<byte> plaintext)
    {
        EnsureKey();
        var key = GetKey();

        var cipher = Cipher.GetInstance("AES/GCM/NoPadding")
                     ?? throw new InvalidOperationException("Cipher provider not available.");
        cipher.Init(CipherMode.EncryptMode, key);

        var iv = cipher.GetIV() ?? Array.Empty<byte>();
        var ct = cipher.DoFinal(plaintext.ToArray()) ?? Array.Empty<byte>();

        if (iv.Length > byte.MaxValue)
            throw new InvalidOperationException("IV too long.");

        var result = new byte[2 + iv.Length + ct.Length];
        result[0] = 1;
        result[1] = (byte)iv.Length;
        Buffer.BlockCopy(iv, 0, result, 2, iv.Length);
        Buffer.BlockCopy(ct, 0, result, 2 + iv.Length, ct.Length);
        return result;
    }

    public byte[] Unprotect(ReadOnlySpan<byte> protectedData)
    {
        var data = protectedData.ToArray();
        if (data.Length < 2)
            throw new InvalidOperationException("Invalid protected payload.");

        var version = data[0];
        if (version != 1)
            throw new InvalidOperationException("Unsupported protected payload version.");

        var ivLen = data[1];
        if (data.Length < 2 + ivLen)
            throw new InvalidOperationException("Invalid protected payload.");

        var iv = new byte[ivLen];
        Buffer.BlockCopy(data, 2, iv, 0, ivLen);

        var ctLen = data.Length - (2 + ivLen);
        var ct = new byte[ctLen];
        Buffer.BlockCopy(data, 2 + ivLen, ct, 0, ctLen);

        EnsureKey();
        var key = GetKey();

        var cipher = Cipher.GetInstance("AES/GCM/NoPadding")
                     ?? throw new InvalidOperationException("Cipher provider not available.");
        var spec = new GCMParameterSpec(128, iv);
        cipher.Init(CipherMode.DecryptMode, key, spec);

        return cipher.DoFinal(ct) ?? Array.Empty<byte>();
    }

    private static void EnsureKey()
    {
        var ks = KeyStore.GetInstance(KeyStoreName)
                 ?? throw new InvalidOperationException("Android keystore not available.");
        ks.Load(null);

        if (ks.ContainsAlias(KeyAlias))
            return;

        var gen = KeyGenerator.GetInstance(KeyProperties.KeyAlgorithmAes, KeyStoreName)
                  ?? throw new InvalidOperationException("KeyGenerator not available.");
        var spec = new KeyGenParameterSpec.Builder(
                KeyAlias,
                KeyStorePurpose.Encrypt | KeyStorePurpose.Decrypt)
            .SetBlockModes(KeyProperties.BlockModeGcm)
            .SetEncryptionPaddings(KeyProperties.EncryptionPaddingNone)
            .SetRandomizedEncryptionRequired(true)
            .Build();

        gen.Init(spec);
        gen.GenerateKey();
    }

    private static IKey GetKey()
    {
        var ks = KeyStore.GetInstance(KeyStoreName)
                 ?? throw new InvalidOperationException("Android keystore not available.");
        ks.Load(null);
        var key = ks.GetKey(KeyAlias, null);
        if (key is null)
            throw new InvalidOperationException("Secret key not found in keystore.");
        return key;
    }
}


