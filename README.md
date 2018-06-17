# Spirit Guide

Spirit Guide is an extremely flexible, functional approach to routing, supported by a minimalistic set of helper functions.

It is particularly convenient when used for web server request routing together with [Spirit](https://github.com/spirit-js/spirit).

```javascript
const http = require("http")
const spirit = require("spirit").node
const {route,which,way} = require("spirit-guide")

const app = which(
	way(
		route("/"),
		req => spirit.fileResponse("index.html")
	),
	way(
		pass => req => req.hostname=="localhost" ? pass(req) : undefined,
		jsonResp,
		req=>req.query
	)
)
http.createServer(spirit.adapter(app)).listen(6103,
 ()=>console.log("http://localhost:6103"))

function jsonResp(pass){return async req=>({
	status:200,
	headers:{"Content-Type":"application/json"},
	body: JSON.stringify(await pass(req))
})}
```

### Why Spirit Guide?

When I found the [Spirit](https://github.com/spirit-js/spirit) library, I instantly loved its simple approach to defining server functionality through functions. Spirit has a peer library for routing, spirit-router, but I personally found the API for it to be hard to use, so I decided to build my own router instead.

Like Spirit, Spirit Guide goes all in on the use of functions, providing great flexibility, composability, inspectability, discoverability, and testability.

# Interfaces

Spirit Guide exposes three functions, `which`, `way`, and `route` (or `r`)

 - which( ...handlers ) -> handler
 - way( ...middlewares, handler ) -> handler
 - route( string ) -> middleware

### which

`which` is used to branch or pick ONE among the provided handlers. It returns a handler which will in turn sequentially pass the provided request to each of the provided handlers until one returns a non-`undefined` value.

Example:

```javascript
which( req => req+1 )(2)
-> 3
```
```javascript
which( req => undefined, req => req+10)(2)
-> 12
```

### way

`way` is used to chain together ONE, MORE, or ALL of a series of steps (aka middleware). Any step along the way can return early, not calling the subsequent handlers. The first middleware can also return undefined so that `which` continues on to the next option.

*Note: In the examples below, I use the name `pass` when defining middleware to refer to the unknown handler that must be called.*

Example:
```javascript
way( pass => async req => await "N"+pass(req+"er"), req=> req+" "+req)("ev")
-> "Never ever"
```
True to typical functional style, it is not recommended to mutate the request object directly, but rather to pass a modified copy to the next handler.

### route
*Also exposed as `r` for shorthand*

`route` takes a string-based representation of a criteria used to match HTTP requests and returns a middleware that accepts the relevant HTTP requests.

```javascript
r("/api/:version")(console.log)({pathname:"/api/v2.1"})
//logs { pathname: '/api/v2.1', params: { version: 'v2.1' } }
```

For example, if you had manually written the following:
```javascript
const app = which(
	way(pass => req => req.pathname == "/" ? pass(req) : undefined ,
		async req => await spirit.fileResponse("index.html")
	)
)
```

You could use `route` to shorten that to:
```javascript
const app = which(
	way(route("/"), async req => await spirit.fileResponse("index.html"))
)
```

Or, using the `r` alias and template literals for maximum conciseness:
```javascript
const app = which(
	way(r`/`, async req => await spirit.fileResponse("index.html"))
)
```

See below for a detailed description of the strings that route accepts.

# Middleware

I've already shown several simple examples of middleware above. However, the signature for middleware is the same as that accepted by spirit-router, so you can find some more [docs about middleware](https://github.com/spirit-js/spirit-router/blob/master/docs/Guide.md#middleware) there, including adapters to [use most Express middleware](https://github.com/spirit-js/spirit-express), and [commonly-used middleware](https://github.com/spirit-js/spirit-common).

# Route string reference

** WARNING: The section below describes intended _but still untested_ behavior**

In addition to path matching, the route function recognizes the following overall pattern:

`"VERB //hostname/path/to/:name/**"`

| Route spec | Req object | Result
| --- | --- | ---
| `/path` |	`{pathname:"/path"})` | Accepts
| `/path` | `{pathname:"/path/plus"}` | **Rejects**
| `/path/*` | `{pathname:"/path/plus"}` | Accepts
| `/path/:var` | `{pathname:"/path/plus"}` | Accepts & adds `params:{var:'plus'}`
| `/path/**` | `{pathname:"/path/plus"}` | Accepts & adds `rest:['plus']`
| way(r`/path/**`,r`/plus`) | `{pathname:"/path/plus"}` | **Rejects**
| way(r`/path/**`,r`.../plus`) | `{pathname:"/path/plus"}` | Accepts
| `//foo.bar` | `{host: "foo.bar"}` | Accepts
| `//foo.bar` | `{host: "www.foo.bar"}` | **Rejects**
| `//*.foo.bar` | `{host: "www.foo.bar"}` | Accepts
| `//*.foo.bar` | `{host: "foo.bar"}` | Accepts
| `//*.foo.bar` | `{host: "www.qa.foo.bar"}` | **Rejects**
| `//**.foo.bar` | `{host: "www.foo.bar"}` | Accepts
| `//**.foo.bar` | `{host: "foo.bar"}` | Accepts
| `//**.foo.bar` | `{host: "www.qa.foo.bar"}` | Accepts
| `GET`	| `{verb: "GET"}` | Accepts
| `*`	| `{}` | Accepts
| `POST /query`	| `{verb: "POST", pathname:"/query"}` | Accepts
| `GET **.foo.bar/`	| `{verb: "POST", host:"foo.bar", pathname:"/"}` | Accepts

As a minimalistic router, there are no constructs for nested or optional path/domain components.


# Examples (TODO)

- Foundational Examples
	- Hello world
	- Serve a static file
	- Respond with JSON
	- Route between static files and API endpoints
- Common routing use cases
	- Serve a chosen static file
	- Differentiate between HTTP verbs
	- Route by domain
	- Group routes by subdirectories
- Code organization
	- Route delegation
	- Bundling middleware
- Common transformations
	- Error handling
	- Response customization
	- Importing Express middleware


### Memoize (TODO)

The following example shows a typical way that a request can be transformed before delegating to subsequent handlers:

```javascript
var app = way(onlyParam('q'), memoize, logIfCalled, final)
function onlyParam(p){return pass => req => pass(req.query[p]) }
app({q:"Memoize me!"}) //Logs
app({q:"Memoize me!"}) //Does not log, due to memoization
app({q:"Memoize me!", misc:"Irrelevant"}) //Does not log, due to first middleware
```
