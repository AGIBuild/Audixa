using System;
using System.IO;
using Microsoft.Data.Sqlite;

namespace AgiBuild.Audixa.Persistence.Sqlite;

public sealed class AudixaSqliteDatabase : IAudixaDatabase
{
    public AudixaSqliteDatabase()
    {
        var root = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var dir = Path.Combine(root, "Audixa");
        Directory.CreateDirectory(dir);
        DbPath = Path.Combine(dir, "audixa.db");
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
}


