using System.Collections.Generic;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;

namespace AgiBuild.Audixa.Stores;

public interface ISmbProfileStore
{
    Task<IReadOnlyList<SmbProfile>> GetAllAsync();
    Task<SmbProfile?> TryGetByIdAsync(string id);
    Task UpsertAsync(SmbProfile profile);
}


