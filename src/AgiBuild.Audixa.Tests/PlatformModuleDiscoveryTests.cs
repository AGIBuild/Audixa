using System;
using AgiBuild.Audixa.AppHost;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AgiBuild.Audixa.Tests;

public sealed class PlatformModuleDiscoveryTests
{
    [Fact]
    public void TryCreate_FindsModuleFromLoadedAssemblies()
    {
        // Our test assembly includes TestPlatformModule (below), so discovery should succeed.
        var module = InvokeTryCreate();
        Assert.NotNull(module);
        Assert.IsType<TestPlatformModule>(module);
    }

    private static IAudixaPlatformModule? InvokeTryCreate()
    {
        // PlatformModuleDiscovery is internal; invoke via reflection.
        var t = typeof(AudixaHost).Assembly.GetType("AgiBuild.Audixa.AppHost.PlatformModuleDiscovery", throwOnError: true)!;
        var m = t.GetMethod("TryCreate", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic)!;
        return (IAudixaPlatformModule?)m.Invoke(null, Array.Empty<object?>());
    }

    private sealed class TestPlatformModule : IAudixaPlatformModule
    {
        public void Register(IServiceCollection services)
        {
            // no-op, just for discovery
        }
    }
}


