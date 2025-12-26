using System.Threading.Tasks;

namespace AgiBuild.Audixa.Sources;

public interface ISourceProvider
{
    string Id { get; }
    string DisplayName { get; }

    Task<MediaOpenRequest?> PickSingleAsync();
}


