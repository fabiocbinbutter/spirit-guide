const {route,which,way} = require('./index.js')
const $ = require("assert")

!async function(){
try{
$.equal(await way(req => req*3)(2), 6, "Sync single way")
$.equal(await way(async req => req*3)(2), 6, "Async single way")

$.equal(await way(pass => req => pass(req*5) , req => req*3)(2), 30, "Accepting sync-sync chain way")
$.equal(await way(pass => async req => await pass(req*5) , req => req*3)(2), 30, "Accepting async-sync chain way")
$.equal(await way(pass => req => pass(req*5) , async req => await req*3)(2), 30, "Accepting sync-async chain way")
$.equal(await way(pass => async req => await pass(req*5) , async req => await req*3)(2), 30, "Accepting async-async chain way")

$.equal(await way(pass => req => undefined , req => req*3)(2), undefined, "Rejecting sync-sync chain way")
$.equal(await way(pass => async req => await undefined , req => req*3)(2), undefined, "Rejecting async-sync chain way")
$.equal(await way(pass => req => undefined , async req => await req*3)(2), undefined, "Rejecting sync-async chain way")
$.equal(await way(pass => async req => undefined , async req => await req*3)(2), undefined, "Rejecting async-async chain way")

$.equal(await which( req => req+1 )(0), 1 , "Sync single which")
$.equal(await which( async req => req+1 )(0), 1 , "Async single which")
$.equal(await which( req => undefined )(0), undefined , "Single rejected which")

$.equal(await which( req => undefined , req => req+2)(0), 2 , "Second which")
$.equal(await which( req => req+1 , req => req+2)(0), 1 , "First which")
$.equal(await which( req => false , req => req+2)(0), false , "False, still first which")
$.equal(await which( req => 0 , req => req+2)(0), 0 , "Zero, still first which")
$.equal(await which( req => null , req => req+2)(0), null , "Null, still first which")
$.equal(await which( req => '' , req => req+2)(0), '' , "'', still first which")
$.equal(await which( req => undefined , req => undefined)(1), undefined , "No which")


console.log("All tests passed")
}catch(e){
console.error(e)
}
}()
