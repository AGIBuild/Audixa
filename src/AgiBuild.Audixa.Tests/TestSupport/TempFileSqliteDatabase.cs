using System;
using System.IO;
using AgiBuild.Audixa.Persistence;
using Microsoft.Data.Sqlite;

namespace AgiBuild.Audixa.Tests.TestSupport;

internal sealed class TempFileSqliteDatabase : IAudixaDatabase, IDisposable
{
    private readonly string _dir;

    public TempFileSqliteDatabase()
    {
        _dir = Path.Combine(Path.GetTempPath(), "AudixaTests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_dir);
        DbPath = Path.Combine(_dir, "audixa-test.db");
    }

    public string DbPath { get; }

    public SqliteConnection OpenConnection()
    {
        var conn = new SqliteConnection(new SqliteConnectionStringBuilder
        {
            DataSource = DbPath,
            Mode = SqliteOpenMode.ReadWriteCreate,
            Cache = SqliteCacheMode.Shared,
        }.ToString());

        conn.Open();
        return conn;
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_dir))
                Directory.Delete(_dir, recursive: true);
        }
        catch
        {
            // ignore
        }
    }
}


