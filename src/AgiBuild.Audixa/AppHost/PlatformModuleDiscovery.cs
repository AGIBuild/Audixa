using System;
using System.Linq;

namespace AgiBuild.Audixa.AppHost;

internal static class PlatformModuleDiscovery
{
    public static IAudixaPlatformModule? TryCreate()
    {
        // Avoid hard references from the shared project to platform projects.
        // Platform projects can provide exactly one implementation of IAudixaPlatformModule.
        var moduleType = AppDomain.CurrentDomain
            .GetAssemblies()
            .SelectMany(a =>
            {
                try
                {
                    return a.GetTypes();
                }
                catch
                {
                    return Array.Empty<Type>();
                }
            })
            .FirstOrDefault(t =>
                typeof(IAudixaPlatformModule).IsAssignableFrom(t) &&
                t is { IsInterface: false, IsAbstract: false } &&
                t.GetConstructor(Type.EmptyTypes) is not null);

        return moduleType is null ? null : (IAudixaPlatformModule?)Activator.CreateInstance(moduleType);
    }
}


