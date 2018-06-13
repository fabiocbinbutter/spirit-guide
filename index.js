exports = module.exports = {
		which, way, route, r:route,
	}

function which(...fns){
		return async (...args) => {
				for(fn of fns){
						let maybeNewFn = await fn(...args)
						if(maybeNewFn !== undefined){return maybeNewFn}
					}
			}
	}
function way(...fns){
		return async (...args) => {
				//console.log(1,...fns)
				var first = fns.shift()
				//console.log(2,...fns)
				return fns.length
						? await first(way(...fns))(...args)
						: await first(...args)
			}
	}
function route(str){
		if(str instanceof Array){str=str[0]} //Template literal invocation
		if(typeof str != "string"){throw "Expected route definition to be a string"}
		var matches = str.match(
				/^((GET|POST|PUT|PATCH|HEAD|DEL|OPTIONS|\*) )?((https?):)?(\/\/([^:\/#?]+))?(:\d+)?(\.\.\.)?(\/[^#?]*)?$/
			)
		var m = {
				verb: matches[2],
				protocol: matches[4],
				domain: matches[6],
				//I could add port, but it would be pointless since node only listens on one port
				ellipsis:matches[8],
				path:matches[9]
			}
		var required = {
				verb: m.verb != '' && m.verb != '*' ? m.verb : undefined,
				protocol: m.protocol,
				domain: m.domain && m.domain.split(".").reverse(),
				ellipsis: !!m.ellipsis,
				path: m.path && m.path.split("/")
			}
		if(required.domain && required.domain.includes("**") && required.domain.indexOf("**") != required.domain.length - 1){
				throw "httpRequestMatch only supports ** at the head of the domain pattern"
			}
		if(required.path && required.path.includes("**") && required.path.indexOf("**") != required.path.length - 1){
				throw "httpRequestMatch only supports ** at the end of the path pattern"
			}

		return handler => async request => {
				var capture = {}, rest
				if(required.verb && reqest.verb != required.verb){return}
				if(required.protocol && request.protocol != required.protocol){return}
				if(required.domain){
						let offset = -1, parts = request.host.split(".").reverse()
						for (let requiredPart of required.domain){
								offset++;
								if(parts[offset] == requiredPart){continue}
								if(requiredPart == "*"){continue}
								if(requiredPart[0] == ":"){
										capture[requiredPart.slice(1)] = parts[offset]
										continue
									}
								if(requiredPart == "**"){
										domainRemainder = parts.slice(offset).join('.')
										break
									}
								return
							}
					}
				if(required.path){
						let offset = -1
						let parts = required.ellipsis && request.rest || request.path.split("/")
						for (let requiredPart of required.path){
								offset++;
								if(parts[offset] == requiredPart){continue}
								if(requiredPart == "*"){continue}
								if(requiredPart[0] == ":"){
										capture[requiredPart.slice(1)] = parts[offset]
										continue
									}
								if(requiredPart == "**"){
										rest = parts.slice(offset)
										break
									}
								return
							}
					}
				return await handler({
						...request,
						...(rest?{rest}:{}),
						params:{
								...request.params,
								...capture
							}
					})
			}
	}
