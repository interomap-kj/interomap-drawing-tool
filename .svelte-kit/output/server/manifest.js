export const manifest = {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([".nojekyll"]),
	mimeTypes: {},
	_: {
		client: {"start":"_app/immutable/entry/start.6bf95330.js","app":"_app/immutable/entry/app.9639333c.js","imports":["_app/immutable/entry/start.6bf95330.js","_app/immutable/chunks/index.7da5a90a.js","_app/immutable/chunks/singletons.1f929ff8.js","_app/immutable/entry/app.9639333c.js","_app/immutable/chunks/index.7da5a90a.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			() => import('./nodes/0.js'),
			() => import('./nodes/1.js')
		],
		routes: [
			
		],
		matchers: async () => {
			
			return {  };
		}
	}
};
