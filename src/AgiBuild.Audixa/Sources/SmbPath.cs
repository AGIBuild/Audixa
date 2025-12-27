using System;

namespace AgiBuild.Audixa.Sources;

public static class SmbPath
{
    public static bool TryParseRoot(string input, out string host, out string share)
    {
        host = string.Empty;
        share = string.Empty;

        if (string.IsNullOrWhiteSpace(input))
            return false;

        var s = input.Trim();

        // UNC: \\host\share
        if (s.StartsWith(@"\\", StringComparison.Ordinal))
        {
            var rest = s.Substring(2);
            var parts = rest.Split(new[] { '\\' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2)
                return false;

            host = parts[0];
            share = parts[1];
            return !string.IsNullOrWhiteSpace(host) && !string.IsNullOrWhiteSpace(share);
        }

        // smb://host/share
        if (Uri.TryCreate(s, UriKind.Absolute, out var uri) &&
            string.Equals(uri.Scheme, "smb", StringComparison.OrdinalIgnoreCase))
        {
            host = uri.Host ?? string.Empty;
            var seg = uri.AbsolutePath.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            if (seg.Length < 1)
                return false;

            share = seg[0];
            return !string.IsNullOrWhiteSpace(host) && !string.IsNullOrWhiteSpace(share);
        }

        return false;
    }

    public static string NormalizeRelativePath(string? relativePath)
    {
        var p = (relativePath ?? string.Empty).Trim().Replace('/', '\\');
        p = p.Trim('\\');
        return p;
    }

    public static string BuildStableLocator(string host, string share, string relativePath)
    {
        var rel = NormalizeRelativePath(relativePath).Replace('\\', '/');
        var path = string.IsNullOrEmpty(rel) ? $"{share}" : $"{share}/{rel}";
        return $"smb://{host}/{path}";
    }
}


