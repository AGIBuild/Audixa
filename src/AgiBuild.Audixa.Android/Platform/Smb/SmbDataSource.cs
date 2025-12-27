using System;
using System.Runtime.Versioning;
using AgiBuild.Audixa.Stores;
using Android.Runtime;
using AndroidX.Media3.Common;
using AndroidX.Media3.DataSource;

namespace AgiBuild.Audixa.Android.Platform.Smb;

[SupportedOSPlatform("android21.0")]
public sealed class SmbDataSource : Java.Lang.Object, IDataSource
{
    private readonly ISecureSecretStore _secrets;
    private readonly SmbjBridgeInvoker _bridge;
    private ITransferListener? _listener;
    private DataSpec? _currentDataSpec;

    private global::Android.Net.Uri? _uri;
    private long _handleId;
    private long _position;

    public SmbDataSource(ISecureSecretStore secrets)
    {
        _secrets = secrets;
        _bridge = new SmbjBridgeInvoker();
    }

    public void AddTransferListener(ITransferListener? transferListener)
    {
        _listener = transferListener;
    }

    public long Open(DataSpec? dataSpec)
    {
        Close();

        if (dataSpec is null)
            throw new ArgumentNullException(nameof(dataSpec));

        _currentDataSpec = dataSpec;
        _uri = dataSpec.Uri;
        if (_uri is null)
            throw new InvalidOperationException("DataSpec.Uri is null.");

        if (!string.Equals(_uri.Scheme, "smb", StringComparison.OrdinalIgnoreCase))
            throw new NotSupportedException("Unsupported scheme: " + _uri.Scheme);

        var host = _uri.Host ?? string.Empty;
        var segments = _uri.PathSegments;
        if (segments is null || segments.Count < 2)
            throw new InvalidOperationException("SMB uri must be smb://host/share/path...");

        var share = segments[1]?.Trim('/') ?? string.Empty;
        var path = string.Join("/", segments).TrimStart('/');
        // strip leading "share/"
        if (path.StartsWith(share + "/", StringComparison.Ordinal))
            path = path.Substring(share.Length + 1);
        // SMBJ expects backslashes.
        path = path.Replace('/', '\\');

        var domain = _uri.GetQueryParameter("domain");
        var username = _uri.GetQueryParameter("user");
        var secretId = _uri.GetQueryParameter("secretId");
        var password = string.IsNullOrWhiteSpace(secretId)
            ? null
            : _secrets.TryGetAsync(secretId).GetAwaiter().GetResult();

        _listener?.OnTransferInitializing(this, dataSpec, true);

        _handleId = _bridge.OpenFile(host, share, path, domain, username, password);
        _position = dataSpec.Position;

        var len = _bridge.Length(_handleId);
        _listener?.OnTransferStart(this, dataSpec, true);
        return len < 0 ? C.LengthUnset : len - _position;
    }

    public int Read(byte[]? buffer, int offset, int readLength)
    {
        if (_handleId == 0)
            return C.ResultEndOfInput;

        if (buffer is null)
            throw new ArgumentNullException(nameof(buffer));

        var n = _bridge.Read(_handleId, _position, buffer, offset, readLength);
        if (n <= 0)
            return C.ResultEndOfInput;

        _listener?.OnBytesTransferred(this, _currentDataSpec, true, n);
        _position += n;
        return n;
    }

    public global::Android.Net.Uri? Uri => _uri;

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            Close();
            _bridge.Dispose();
        }
        base.Dispose(disposing);
    }

    public void Close()
    {
        if (_handleId != 0)
        {
            try { _bridge.Close(_handleId); } catch { /* ignore */ }
            _handleId = 0;
        }

        _uri = null;
        _position = 0;
        _currentDataSpec = null;
    }
}


