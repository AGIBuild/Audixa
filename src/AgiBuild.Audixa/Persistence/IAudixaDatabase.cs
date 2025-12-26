using Microsoft.Data.Sqlite;

namespace AgiBuild.Audixa.Persistence;

public interface IAudixaDatabase
{
    string DbPath { get; }
    SqliteConnection OpenConnection();
}


