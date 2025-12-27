using System.Threading.Tasks;

namespace AgiBuild.Audixa.Stores;

public interface ISecureSecretStore
{
    Task<string> UpsertAsync(string purpose, string plaintext, string? secretId = null);
    Task<string?> TryGetAsync(string secretId);
    Task DeleteAsync(string secretId);
}


