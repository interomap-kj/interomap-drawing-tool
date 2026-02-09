export const manifest = {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([".nojekyll"]),
	mimeTypes: {},
	_: {
		client: {"start":"_app/immutable/entry/start.8de89a49.js","app":"_app/immutable/entry/app.babeac2a.js","imports":["_app/immutable/entry/start.8de89a49.js","_app/immutable/chunks/index.7da5a90a.js","_app/immutable/chunks/singletons.23cddbd7.js","_app/immutable/entry/app.babeac2a.js","_app/immutable/chunks/index.7da5a90a.js"],"stylesheets":[],"fonts":[]},
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
