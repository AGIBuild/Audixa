using Microsoft.Extensions.DependencyInjection;

namespace AgiBuild.Audixa.AppHost;

public interface IAudixaPlatformModule
{
    void Register(IServiceCollection services);
}


