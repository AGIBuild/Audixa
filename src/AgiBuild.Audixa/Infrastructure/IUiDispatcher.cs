using System;

namespace AgiBuild.Audixa.Infrastructure;

public interface IUiDispatcher
{
    void Post(Action action);
}


