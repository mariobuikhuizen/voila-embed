Vue.use(Vuetify);

Vue.component('jupyter-widget-embed', {
    data() {
        return {
            renderFn: undefined,
            elem: undefined,
            mountPath: `${this.voilaUrl}${this.notebook}${this.mountId}`,
        }
    },
    props: ['voila-url', 'notebook', 'mount-id'],
    created() {
        init(this.voilaUrl, this.notebook);
        requestWidget(this.mountPath);
    },
    mounted() {
        requestWidget(this.mountPath)
            .then(widgetView => {
                    if (['VuetifyView', 'VuetifyTemplateView'].includes(widgetView.model.get('_view_name'))) {
                        this.renderFn = createElement => widgetView.vueRender(createElement);
                    } else {
                        while (this.$el.firstChild) {
                            this.$el.removeChild(this.$el.firstChild);
                        }

                        requirejs(['@jupyter-widgets/base'], widgets =>
                            widgets.JupyterPhosphorWidget.attach(widgetView.pWidget, this.$el)
                        );
                    }
                }
            );
    },
    render(createElement) {
        if (this.renderFn) {
            /* workaround for v-menu click */
            if (!this.elem) {
                this.elem = this.renderFn(createElement);
            }
            return this.elem;
        }
        return createElement('div', this.$slots.default ||
            [createElement(
                'v-chip',
                {staticStyle: { "white-space": "initial"}},
                [`[${this.notebook} - ${this.mountId}]`,
                    createElement('v-progress-circular', {attrs: {indeterminate: true}})])]);
    }
});

const widgetResolveFns = {};
const widgetPromises = {};

function provideWidget(mountPath, widgetView) {
    if (widgetResolveFns[mountPath]) {
        widgetResolveFns[mountPath](widgetView);
    } else {
        widgetPromises[mountPath] = Promise.resolve(widgetView);
    }
}

function requestWidget(mountPath) {
    if (!widgetPromises[mountPath]) {
        widgetPromises[mountPath] = new Promise(resolve => widgetResolveFns[mountPath] = resolve);
    }
    return widgetPromises[mountPath];
}

function getWidgetManager(voila, kernel) {
    try {
        /* voila < 0.1.8 */
        return new voila.WidgetManager(kernel);
    } catch (e) {
        if (e instanceof TypeError) {
            /* voila >= 0.1.8 */
            const context = {
                session: {
                    kernel,
                    kernelChanged: {
                        connect: () => {
                        }
                    },
                    statusChanged: {
                        connect: () => {
                        }
                    },
                },
                saveState: {
                    connect: () => {
                    }
                },
            };

            const settings = {
                saveState: false
            };

            const rendermime = new voila.RenderMimeRegistry({
                initialFactories: voila.standardRendererFactories
            });

            return new voila.WidgetManager(context, rendermime, settings);
        } else {
            throw e;
        }
    }
}

const notebooksLoaded = {};

async function init(voilaUrl, notebook) {
    addVoilaTags(voilaUrl);

    const notebookKey = `${voilaUrl}${notebook}`;
    if (notebooksLoaded[notebookKey]) {
        return;
    }
    notebooksLoaded[notebookKey] = true;

    const res = await fetch(`${voilaUrl}/voila/render/${notebook}`);
    const json = await res.json();

    requirejs.config({
        baseUrl: `${voilaUrl}${json.baseUrl}voila`,
        waitSeconds: 3000,
        map: {
            '*': {
                'jupyter-vue': `${voilaUrl}/voila/nbextensions/jupyter-vue/nodeps.js`,
                'jupyter-vuetify': `${voilaUrl}/voila/nbextensions/jupyter-vuetify/nodeps.js`,
            },
        }
    });

    const extensions = json.extensions
        .filter(extension => !extension.includes('jupyter-vue'))
        .map(extension => `${voilaUrl}${extension}`);

    requirejs(extensions);
    requirejs(['static/voila'], (voila) => {
        define("vue", [], () => Vue);
        (async () => {
            const kernel = await voila.connectKernel(`${voilaUrl}${json.baseUrl}`, json.kernelId);
            const widgetManager = getWidgetManager(voila, kernel);
            await widgetManager._build_models();

            Object.values(widgetManager._models)
                .map(async (modelPromise) => {
                    const model = await modelPromise;
                    const meta = model.get('_metadata');
                    const mountId = meta && meta.mount_id;
                    if (mountId && model.get('_view_name')) {
                        const view = await widgetManager.create_view(model);
                        provideWidget(`${notebookKey}${mountId}`, view);
                    }
                });
        })();
    });
}

function addVoilaTags(voilaUrl) {
    if (!document.getElementById('tag-requirejs')) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js';
        script.id="tag-requirejs";
        document.head.appendChild(script);
    }
    if (!document.getElementById('tag-index.css')) {
        const link = document.createElement('link');
        link.href = `${voilaUrl}/voila/static/index.css`;
        link.id="tag-index.css";
        document.head.appendChild(link);
    }
    if (!document.getElementById('tag-theme-light.css')) {
        const link = document.createElement('link');
        link.href = `${voilaUrl}/voila/static/theme-light.css`;
        link.id="tag-theme-light.css";
        document.head.appendChild(link);
    }
}
