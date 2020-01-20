# voila-embed

Embed jupyter widgets in existing websites.

![voila-embed](https://user-images.githubusercontent.com/46192475/68395799-bbfb6080-0170-11ea-84d3-90c8078e28bd.gif)

## Demo

Setup:
```
$ git clone https://github.com/mariobuikhuizen/voila-embed.git
$ cd voila-embed
$ conda create -n ve -c conda-forge -y python voila ipyvuetify=1.0.4 bqplot=0.11 nodejs
$ conda activate ve
(ve)$ pip install -e .
```

Start example site:
```
$ conda activate ve
(ve)$ cd example_site
(ve)$ npx serve
```

Start voilà (in another terminal):
```
$ conda activate ve
(ve)$ voila --no-browser --template=embed --enable_nbextensions=True --Voila.tornado_settings="{'allow_origin': 'http://localhost:5000'}" --port=8000
```

Open browser and go to `http://localhost:5000`

## Online demo
Using Heroku for hosting a voila server and github pages as webserver: https://mariobuikhuizen.github.io/voila-embed

## Usage

Include the voila-embed.js script in your [Vuetify](https://v15.vuetifyjs.com/en/) site:
```html
<script src="voila-embed.js"></script>
```

Add jupyter widgets with:
```html
<jupyter-widget-embed
        voila-url="http://example.com:8000"
        notebook="notebook.ipynb"
        mount-id="my-widget"
></jupyter-widget-embed>
```

The displayed content while loading can be replaced by specifying your own content within the
jupyter-widget-embed tag.

In your notebook set `_metadata={'mount_id': 'my-widget'}` on a ipyvuetify widget or
`.add_traits(_metadata=traitlets.Dict(default_value={'mount_id': 'my-widget'}).tag(sync=True))` on
any other widget.

See [example_site/index.html](example_site/index.html) for an example.

## Advanced usage

Widget models can be accessed from the page. With these models events can be sent to the kernel and
properties can be changed and observed. Widget models are [Backbone.js models](https://backbonejs.org/#Model).

### Get a reference to a widget model
```javascript
requestWidget({
    voilaUrl: 'http://localhost:8000',
    notebook: 'notebook2.ipynb',
    mountId: 'event_demo',
}).then(widgetModel => {
    ...
});
```

### Send an event
```javascript
...
}).then(widgetModel => {
    this.widgetModel = widgetModel
});
...
this.widgetModel.send({
    event: 'click',
    data: {},
});
```
There are three kinds of events:
1. When e.g. `.on_event('click', my_fn)` on a Vuetify subclass is used, the click event can be
   triggered by sending: `{ event: 'click', data: {...} }`.
2. When e.g. `@click="my_fn()"` on a VuetifyTemplate subclass is used, the click event can be
   triggered by sending: `{ event: 'my_fn', data: {...} }`.
3. A custom event can be sent by sending any object. The Widget needs to implement a handler for
   this event: `self.on_msg(my_handler)`, this handler should inspect the content of the message to
   determine if it is the intended recipient.

### Access properties
* Read a property: `widgetModel.get('my_prop')`
* Set a property: `widgetModel.set('my_prop', 42)` and `widgetModel.save_changes()` 
* Listen to changes: `widgetModel.on('change:my_prop', () =>
  { this.myProp = widgetModel.get('my_prop') })`

See [Backbone.js](https://backbonejs.org/#Model) for more info.
