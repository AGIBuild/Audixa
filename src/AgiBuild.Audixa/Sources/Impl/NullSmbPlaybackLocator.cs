using System;
using AgiBuild.Audixa.Domain;

namespace AgiBuild.Audixa.Sources.Impl;

public sealed class NullSmbPlaybackLocator : ISmbPlaybackLocator
{
    public Uri CreatePlaybackUri(string host, string share, string relativePath, SmbProfile profile) =>
        throw new NotSupportedException("SMB playback is not configured for this platform.");
}


