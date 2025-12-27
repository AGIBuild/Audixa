using System;
using Avalonia.Threading;

namespace AgiBuild.Audixa.Infrastructure;

public sealed class AvaloniaUiDispatcher : IUiDispatcher
{
    public void Post(Action action)
    {
        Dispatcher.UIThread.Post(action);
    }
}


