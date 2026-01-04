using System;
using System.Threading.Tasks;
using AgiBuild.Audixa.ViewModels;
using Avalonia.Controls;

namespace AgiBuild.Audixa.Views;

public partial class LibraryView : UserControl
{
    private bool _autoLoadingMore;

    public LibraryView()
    {
        InitializeComponent();
    }

    private async void RootScroll_OnScrollChanged(object? sender, ScrollChangedEventArgs e)
    {
        if (_autoLoadingMore)
            return;

        if (DataContext is not LibraryViewModel vm)
            return;

        if (!vm.CanLoadMoreSmbEntries || vm.IsSmbLoading)
            return;

        if (sender is not ScrollViewer sv)
            return;

        // Near-bottom threshold (px)
        const double threshold = 200;
        var distanceToBottom = sv.Extent.Height - (sv.Offset.Y + sv.Viewport.Height);
        if (distanceToBottom > threshold)
            return;

        try
        {
            _autoLoadingMore = true;
            await vm.LoadMoreSmbCommand.ExecuteAsync(null);
        }
        catch
        {
            // Ignore: user can still use the explicit Load more button.
        }
        finally
        {
            _autoLoadingMore = false;
        }
    }
}


