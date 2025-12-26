using AgiBuild.Audixa.Persistence.Sqlite;
using AgiBuild.Audixa.Tests.TestSupport;
using Microsoft.Data.Sqlite;
using Xunit;

namespace AgiBuild.Audixa.Tests;

public sealed class SqliteDatabaseInitializerTests
{
    [Fact]
    public void Initialize_SetsUserVersionTo2_AndCreatesTables()
    {
        using var db = new TempFileSqliteDatabase();
        var init = new SqliteDatabaseInitializer(db);

        init.Initialize();

        using var conn = db.OpenConnection();

        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "PRAGMA user_version;";
            var v = cmd.ExecuteScalar();
            Assert.Equal(2, v is long l ? (int)l : 0);
        }

        AssertTableExists(conn, "media_item");
        AssertTableExists(conn, "saved_sentence");
        AssertTableExists(conn, "vocabulary_item");
        AssertTableExists(conn, "outbox");
        AssertTableExists(conn, "smb_profile");
    }

    private static void AssertTableExists(SqliteConnection conn, string table)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name=$name;";
        cmd.Parameters.AddWithValue("$name", table);
        var v = cmd.ExecuteScalar();
        Assert.Equal(table, v as string);
    }
}


