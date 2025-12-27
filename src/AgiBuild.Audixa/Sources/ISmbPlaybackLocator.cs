using System;
using AgiBuild.Audixa.Domain;

namespace AgiBuild.Audixa.Sources;

public interface ISmbPlaybackLocator
{
    Uri CreatePlaybackUri(string host, string share, string relativePath, SmbProfile profile);
}


