using System;
using System.Runtime.Versioning;
using Android.Runtime;

namespace AgiBuild.Audixa.Android.Platform.Smb;

/// <summary>
/// Minimal JNI invoker for <c>com.agibuild.audixa.smb.SmbjBridge</c>.
/// Keep this tiny and stable to avoid the complexity of generating full bindings for SMBJ jars.
/// </summary>
[SupportedOSPlatform("android21.0")]
internal sealed class SmbjBridgeInvoker : IDisposable
{
    private static readonly IntPtr ClassRef;
    private static readonly IntPtr CtorId;
    private static readonly IntPtr OpenFileId;
    private static readonly IntPtr ListDirectoryId;
    private static readonly IntPtr ReadId;
    private static readonly IntPtr LengthId;
    private static readonly IntPtr CloseId;

    private IntPtr _instance; // global ref

    static SmbjBridgeInvoker()
    {
        if (!OperatingSystem.IsAndroid())
            throw new PlatformNotSupportedException("SmbjBridgeInvoker is Android-only.");

        var local = JNIEnv.FindClass("com/agibuild/audixa/smb/SmbjBridge");
        ClassRef = JNIEnv.NewGlobalRef(local);
        JNIEnv.DeleteLocalRef(local);

        CtorId = JNIEnv.GetMethodID(ClassRef, "<init>", "()V");
        OpenFileId = JNIEnv.GetMethodID(ClassRef, "openFile",
            "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)J");
        ListDirectoryId = JNIEnv.GetMethodID(ClassRef, "listDirectory",
            "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)[Ljava/lang/String;");
        ReadId = JNIEnv.GetMethodID(ClassRef, "read", "(JJ[BII)I");
        LengthId = JNIEnv.GetMethodID(ClassRef, "length", "(J)J");
        CloseId = JNIEnv.GetMethodID(ClassRef, "close", "(J)V");
    }

    public SmbjBridgeInvoker()
    {
        var local = JNIEnv.NewObject(ClassRef, CtorId);
        _instance = JNIEnv.NewGlobalRef(local);
        JNIEnv.DeleteLocalRef(local);
    }

    public long OpenFile(string host, string share, string path, string? domain, string? username, string? password)
    {
        ThrowIfDisposed();

        var jHost = JNIEnv.NewString(host);
        var jShare = JNIEnv.NewString(share);
        var jPath = JNIEnv.NewString(path);
        var jDomain = domain is null ? IntPtr.Zero : JNIEnv.NewString(domain);
        var jUser = username is null ? IntPtr.Zero : JNIEnv.NewString(username);
        var jPass = password is null ? IntPtr.Zero : JNIEnv.NewString(password);

        try
        {
            var args = new JValue[6];
            args[0] = new JValue(jHost);
            args[1] = new JValue(jShare);
            args[2] = new JValue(jPath);
            args[3] = new JValue(jDomain);
            args[4] = new JValue(jUser);
            args[5] = new JValue(jPass);
            return JNIEnv.CallLongMethod(_instance, OpenFileId, args);
        }
        finally
        {
            JNIEnv.DeleteLocalRef(jHost);
            JNIEnv.DeleteLocalRef(jShare);
            JNIEnv.DeleteLocalRef(jPath);
            if (jDomain != IntPtr.Zero) JNIEnv.DeleteLocalRef(jDomain);
            if (jUser != IntPtr.Zero) JNIEnv.DeleteLocalRef(jUser);
            if (jPass != IntPtr.Zero) JNIEnv.DeleteLocalRef(jPass);
        }
    }

    public string[] ListDirectory(string host, string share, string path, string? domain, string? username, string? password)
    {
        ThrowIfDisposed();

        var jHost = JNIEnv.NewString(host);
        var jShare = JNIEnv.NewString(share);
        var jPath = JNIEnv.NewString(path);
        var jDomain = domain is null ? IntPtr.Zero : JNIEnv.NewString(domain);
        var jUser = username is null ? IntPtr.Zero : JNIEnv.NewString(username);
        var jPass = password is null ? IntPtr.Zero : JNIEnv.NewString(password);

        try
        {
            var args = new JValue[6];
            args[0] = new JValue(jHost);
            args[1] = new JValue(jShare);
            args[2] = new JValue(jPath);
            args[3] = new JValue(jDomain);
            args[4] = new JValue(jUser);
            args[5] = new JValue(jPass);

            var obj = JNIEnv.CallObjectMethod(_instance, ListDirectoryId, args);
            if (obj == IntPtr.Zero)
                return Array.Empty<string>();

            try
            {
                return (string[]?)JNIEnv.GetArray(obj, JniHandleOwnership.DoNotTransfer, typeof(string)) ?? Array.Empty<string>();
            }
            finally
            {
                JNIEnv.DeleteLocalRef(obj);
            }
        }
        finally
        {
            JNIEnv.DeleteLocalRef(jHost);
            JNIEnv.DeleteLocalRef(jShare);
            JNIEnv.DeleteLocalRef(jPath);
            if (jDomain != IntPtr.Zero) JNIEnv.DeleteLocalRef(jDomain);
            if (jUser != IntPtr.Zero) JNIEnv.DeleteLocalRef(jUser);
            if (jPass != IntPtr.Zero) JNIEnv.DeleteLocalRef(jPass);
        }
    }

    public int Read(long handleId, long offset, byte[] buffer, int bufferOffset, int length)
    {
        ThrowIfDisposed();

        var arr = JNIEnv.NewArray(buffer);
        try
        {
            var args = new JValue[5];
            args[0] = new JValue(handleId);
            args[1] = new JValue(offset);
            args[2] = new JValue(arr);
            args[3] = new JValue(bufferOffset);
            args[4] = new JValue(length);

            var read = JNIEnv.CallIntMethod(_instance, ReadId, args);
            JNIEnv.CopyArray(arr, buffer);
            return read;
        }
        finally
        {
            JNIEnv.DeleteLocalRef(arr);
        }
    }

    public long Length(long handleId)
    {
        ThrowIfDisposed();
        var args = new JValue[1];
        args[0] = new JValue(handleId);
        return JNIEnv.CallLongMethod(_instance, LengthId, args);
    }

    public void Close(long handleId)
    {
        ThrowIfDisposed();
        var args = new JValue[1];
        args[0] = new JValue(handleId);
        JNIEnv.CallVoidMethod(_instance, CloseId, args);
    }

    public void Dispose()
    {
        var inst = _instance;
        _instance = IntPtr.Zero;
        if (inst != IntPtr.Zero)
            JNIEnv.DeleteGlobalRef(inst);
    }

    private void ThrowIfDisposed()
    {
        if (_instance == IntPtr.Zero)
            throw new ObjectDisposedException(nameof(SmbjBridgeInvoker));
    }
}


