export const manifest = {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([".nojekyll"]),
	mimeTypes: {},
	_: {
		client: {"start":"_app/immutable/entry/start.601aa571.js","app":"_app/immutable/entry/app.9194c46a.js","imports":["_app/immutable/entry/start.601aa571.js","_app/immutable/chunks/index.7da5a90a.js","_app/immutable/chunks/singletons.44945507.js","_app/immutable/entry/app.9194c46a.js","_app/immutable/chunks/index.7da5a90a.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			() => import('./nodes/0.js'),
			() => import('./nodes/1.js'),
			() => import('./nodes/2.js')
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0], errors: [1], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
};
