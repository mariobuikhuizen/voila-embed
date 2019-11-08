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
(ve)$ voila --Voila.open_browser=False --template=embed --VoilaConfiguration.enable_nbextensions=True --Voila.tornado_settings="{'allow_origin': 'http://localhost:5000'}" --port=8000
```

Open browser and go to `http://localhost:5000`

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

## Online demo
Using Heroku for hosting a voila server and github pages as webserver: https://mariobuikhuizen.github.io/voila-embed
