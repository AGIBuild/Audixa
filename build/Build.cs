using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Runtime.InteropServices;
using Nuke.Common;
using Nuke.Common.IO;
using Nuke.Common.Tooling;
using Nuke.Common.Tools.DotNet;
using Nuke.Common.Utilities.Collections;
using static Nuke.Common.IO.PathConstruction;
using static Nuke.Common.Tools.DotNet.DotNetTasks;

class AudixaBuild : NukeBuild
{
    /// <summary>
    /// Usage:
    ///   nuke build              - Build the solution
    ///   nuke run                - Run the current platform's app (Desktop on Windows/macOS)
    ///   nuke run --platform android   - Run Android app (requires emulator/device)
    ///   nuke test               - Run all tests
    ///   nuke publish            - Publish all platforms
    ///   nuke publish --platform windows  - Publish Windows only
    /// </summary>
    public static int Main() => Execute<AudixaBuild>(x => x.Build);

    [Parameter("Configuration to build - Default is 'Debug' (local) or 'Release' (server)")]
    readonly Configuration Configuration = IsLocalBuild ? Configuration.Debug : Configuration.Release;

    [Parameter("Target platform for Run/Publish: windows, macos, linux, android, ios, all")]
    readonly string Platform = GetDefaultPlatform();

    [Parameter("Runtime identifier override (e.g., win-x64, osx-arm64, android-arm64)")]
    readonly string Runtime;

    [Parameter("Application version for Velopack packaging (e.g., 1.0.0)")]
    readonly string Version = "1.0.0";

    const string AppId = "AgiBuild.Audixa";
    const string MainExe = "AgiBuild.Audixa.Desktop.exe";

    AbsolutePath SourceDirectory => RootDirectory / "src";
    AbsolutePath ArtifactsDirectory => RootDirectory / "artifacts";

    AbsolutePath SolutionFile => SourceDirectory / "AgiBuild.Audixa.slnx";
    AbsolutePath DesktopProject => SourceDirectory / "AgiBuild.Audixa.Desktop" / "AgiBuild.Audixa.Desktop.csproj";
    AbsolutePath AndroidProject => SourceDirectory / "AgiBuild.Audixa.Android" / "AgiBuild.Audixa.Android.csproj";
    AbsolutePath IosProject => SourceDirectory / "AgiBuild.Audixa.iOS" / "AgiBuild.Audixa.iOS.csproj";
    AbsolutePath TestProject => SourceDirectory / "AgiBuild.Audixa.Tests" / "AgiBuild.Audixa.Tests.csproj";

    static string GetDefaultPlatform()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            return "windows";
        if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            return "macos";
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            return "linux";
        return "windows";
    }

    Target Clean => _ => _
        .Before(Restore)
        .Executes(() =>
        {
            SourceDirectory.GlobDirectories("**/bin", "**/obj")
                .Where(d => !d.ToString().Contains("build"))
                .ForEach(d => d.DeleteDirectory());
            ArtifactsDirectory.CreateOrCleanDirectory();
        });

    Target Restore => _ => _
        .Executes(() =>
        {
            DotNetRestore(s => s
                .SetProjectFile(SolutionFile));
        });

    Target Build => _ => _
        .DependsOn(Restore)
        .Executes(() =>
        {
            var platform = Platform.ToLowerInvariant();
            Serilog.Log.Information("Building for platform: {Platform}", platform);

            // Keep `nuke build` practical on each host OS by default.
            // Use `--platform all` to build the full solution on a machine that supports all workloads.
            switch (platform)
            {
                case "all":
                    DotNetBuild(s => s
                        .SetProjectFile(SolutionFile)
                        .SetConfiguration(Configuration)
                        .EnableNoRestore());
                    break;

                case "windows":
                case "macos":
                case "linux":
                    DotNetBuild(s => s
                        .SetProjectFile(DesktopProject)
                        .SetConfiguration(Configuration)
                        .EnableNoRestore());
                    DotNetBuild(s => s
                        .SetProjectFile(TestProject)
                        .SetConfiguration(Configuration)
                        .EnableNoRestore());
                    break;

                case "android":
                    DotNetBuild(s => s
                        .SetProjectFile(AndroidProject)
                        .SetConfiguration(Configuration)
                        .SetFramework("net9.0-android")
                        .EnableNoRestore());
                    DotNetBuild(s => s
                        .SetProjectFile(TestProject)
                        .SetConfiguration(Configuration)
                        .EnableNoRestore());
                    break;

                case "ios":
                    DotNetBuild(s => s
                        .SetProjectFile(IosProject)
                        .SetConfiguration(Configuration)
                        .SetFramework("net9.0-ios")
                        .EnableNoRestore());
                    DotNetBuild(s => s
                        .SetProjectFile(TestProject)
                        .SetConfiguration(Configuration)
                        .EnableNoRestore());
                    break;

                default:
                    throw new ArgumentException($"Unknown platform: {platform}. Use: windows, macos, linux, android, ios, all");
            }
        });

    // Back-compat alias: some callers may still use `nuke compile`
    Target Compile => _ => _
        .DependsOn(Build);

    Target Test => _ => _
        .DependsOn(Build)
        .Executes(() =>
        {
            DotNetTest(s => s
                .SetProjectFile(TestProject)
                .SetConfiguration(Configuration)
                .EnableNoRestore()
                .EnableNoBuild()
                .SetResultsDirectory(ArtifactsDirectory / "test-results"));
        });

    Target Run => _ => _
        .DependsOn(Build)
        .Executes(() =>
        {
            var platform = Platform.ToLowerInvariant();
            Serilog.Log.Information("Running platform: {Platform}", platform);

            switch (platform)
            {
                case "windows":
                case "macos":
                case "linux":
                    RunDesktop();
                    break;
                case "android":
                    RunAndroid();
                    break;
                case "ios":
                    RunIos();
                    break;
                default:
                    throw new ArgumentException($"Unknown platform: {platform}. Use: windows, macos, android, ios");
            }
        });

    void RunDesktop()
    {
        DotNetRun(s => s
            .SetProjectFile(DesktopProject)
            .SetConfiguration(Configuration)
            .EnableNoRestore()
            .EnableNoBuild());
    }

    void RunAndroid()
    {
        // Android requires: emulator running or device connected
        Serilog.Log.Information("Running Android app (ensure emulator/device is connected)...");
        DotNetRun(s => s
            .SetProjectFile(AndroidProject)
            .SetConfiguration(Configuration)
            .SetFramework("net9.0-android")
            .EnableNoRestore());
    }

    void RunIos()
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
        {
            Serilog.Log.Warning("iOS can only be run on macOS. Skipping.");
            return;
        }

        // iOS requires: simulator or device
        Serilog.Log.Information("Running iOS app (ensure simulator is running)...");
        DotNetRun(s => s
            .SetProjectFile(IosProject)
            .SetConfiguration(Configuration)
            .SetFramework("net9.0-ios")
            .EnableNoRestore());
    }

    Target Publish => _ => _
        .DependsOn(Clean, Restore)
        .Executes(() =>
        {
            var platform = Platform.ToLowerInvariant();
            Serilog.Log.Information("Publishing for platform: {Platform}", platform);

            ArtifactsDirectory.CreateDirectory();

            switch (platform)
            {
                case "windows":
                    PublishWindows();
                    break;
                case "macos":
                    PublishMacOS();
                    break;
                case "android":
                    PublishAndroid();
                    break;
                case "ios":
                    PublishIos();
                    break;
                case "all":
                    PublishWindows();
                    PublishAndroid();
                    if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                    {
                        PublishMacOS();
                        PublishIos();
                    }
                    break;
                default:
                    throw new ArgumentException($"Unknown platform: {platform}. Use: windows, macos, android, ios, all");
            }
        });

    void PublishWindows()
    {
        var rid = Runtime ?? "win-x64";
        var publishDir = ArtifactsDirectory / "windows" / rid / "publish";
        var releasesDir = ArtifactsDirectory / "windows" / rid / "releases";

        Serilog.Log.Information("Publishing Windows ({Rid}) to {Output}...", rid, publishDir);

        // Step 1: dotnet publish (no single-file for Velopack compatibility)
        DotNetPublish(s => s
            .SetProject(DesktopProject)
            .SetConfiguration(Configuration.Release)
            .SetRuntime(rid)
            .SetSelfContained(true)
            .SetProperty("PublishSingleFile", "false")
            .SetProperty("PublishTrimmed", "false")
            .SetOutput(publishDir));

        // Step 2: Velopack pack
        Serilog.Log.Information("Creating Velopack installer...");
        releasesDir.CreateOrCleanDirectory();

        var vpkArgs = $"pack " +
                      $"--packId {AppId} " +
                      $"--packVersion {Version} " +
                      $"--packDir \"{publishDir}\" " +
                      $"--mainExe {MainExe} " +
                      $"--outputDir \"{releasesDir}\"";

        RunVpk(vpkArgs);

        // Also create portable zip for users who prefer it
        WritePortableZip(publishDir, ArtifactsDirectory / "windows" / $"audixa-{rid}-portable.zip");

        Serilog.Log.Information("Windows publish complete:");
        Serilog.Log.Information("  Installer: {Releases}", releasesDir);
        Serilog.Log.Information("  Portable:  {Zip}", ArtifactsDirectory / "windows" / $"audixa-{rid}-portable.zip");
    }

    void PublishMacOS()
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
        {
            Serilog.Log.Warning("macOS publish should be done on macOS for proper .app bundle. Skipping.");
            return;
        }

        var rid = Runtime ?? (RuntimeInformation.ProcessArchitecture == Architecture.Arm64 ? "osx-arm64" : "osx-x64");
        var publishDir = ArtifactsDirectory / "macos" / rid / "publish";
        var releasesDir = ArtifactsDirectory / "macos" / rid / "releases";
        var mainExeMac = "AgiBuild.Audixa.Desktop";

        Serilog.Log.Information("Publishing macOS ({Rid}) to {Output}...", rid, publishDir);

        DotNetPublish(s => s
            .SetProject(DesktopProject)
            .SetConfiguration(Configuration.Release)
            .SetRuntime(rid)
            .SetSelfContained(true)
            .SetOutput(publishDir));

        // Velopack pack for macOS
        Serilog.Log.Information("Creating Velopack installer...");
        releasesDir.CreateOrCleanDirectory();

        var vpkArgs = $"pack " +
                      $"--packId {AppId} " +
                      $"--packVersion {Version} " +
                      $"--packDir \"{publishDir}\" " +
                      $"--mainExe {mainExeMac} " +
                      $"--outputDir \"{releasesDir}\"";

        RunVpk(vpkArgs);

        WritePortableZip(publishDir, ArtifactsDirectory / "macos" / $"audixa-{rid}-portable.zip");

        Serilog.Log.Information("macOS publish complete:");
        Serilog.Log.Information("  Installer: {Releases}", releasesDir);
        Serilog.Log.Information("  Portable:  {Zip}", ArtifactsDirectory / "macos" / $"audixa-{rid}-portable.zip");
    }

    void PublishAndroid()
    {
        var outputDir = ArtifactsDirectory / "android";

        Serilog.Log.Information("Publishing Android to {Output}...", outputDir);

        // Build signed APK/AAB
        DotNetPublish(s => s
            .SetProject(AndroidProject)
            .SetConfiguration(Configuration.Release)
            .SetOutput(outputDir)
            .SetProperty("AndroidPackageFormat", "apk")
            .SetProperty("AndroidCreatePackagePerAbi", "false"));

        // Copy APK to artifacts
        var apkFiles = (outputDir).GlobFiles("**/*.apk");
        foreach (var apk in apkFiles)
        {
            Serilog.Log.Information("APK: {Apk}", apk);
        }

        Serilog.Log.Information("Android publish complete: {Output}", outputDir);
    }

    void PublishIos()
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
        {
            Serilog.Log.Warning("iOS publish requires macOS. Skipping.");
            return;
        }

        var outputDir = ArtifactsDirectory / "ios";

        Serilog.Log.Information("Publishing iOS to {Output}...", outputDir);

        DotNetPublish(s => s
            .SetProject(IosProject)
            .SetConfiguration(Configuration.Release)
            .SetOutput(outputDir)
            .SetProperty("ArchiveOnBuild", "true")
            .SetProperty("RuntimeIdentifier", "ios-arm64"));

        Serilog.Log.Information("iOS publish complete: {Output}", outputDir);
    }

    static void WritePortableZip(AbsolutePath publishedDir, AbsolutePath zipPath)
    {
        zipPath.Parent.CreateDirectory();

        if (File.Exists(zipPath))
            File.Delete(zipPath);

        ZipFile.CreateFromDirectory(publishedDir, zipPath, CompressionLevel.SmallestSize, includeBaseDirectory: false);
        Serilog.Log.Information("Portable zip: {Zip}", zipPath);
    }

    /// <summary>
    /// Runs the Velopack CLI (vpk) via dotnet tool.
    /// Ensure vpk is installed: dotnet tool install -g vpk
    /// </summary>
    static void RunVpk(string arguments)
    {
        var toolPath = ToolResolver.TryGetEnvironmentTool("vpk");

        if (toolPath != null)
        {
            Serilog.Log.Information("Running: vpk {Args}", arguments);
            toolPath.Invoke(arguments);
        }
        else
        {
            // Fallback: try running via dotnet tool run (for local tool manifest)
            Serilog.Log.Information("Running: dotnet vpk {Args}", arguments);
            DotNet($"vpk {arguments}");
        }
    }
}
