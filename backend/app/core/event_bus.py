event_loop = None


def set_event_loop(loop):

    global event_loop

    event_loop = loop


def publish_event(event):

    print("\n[XDR EVENT]")
    print(event)