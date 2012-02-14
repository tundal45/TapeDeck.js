jasmine.vcr = (function(){
  var storeResponse = function(options, response, invalidateInSeconds) {
    var key = JSON.stringify(options);
    var expiresOn = new Date();
    expiresOn.setSeconds(expiresOn.getSeconds() + invalidateInSeconds);
    var value = JSON.stringify({
      expiresOn: expiresOn,
      response: response
    });
    localStorage.setItem(key, value);
  };

  var retrieveResponse = function(options) {
    var key = JSON.stringify(options);
    var response = localStorage.getItem(key);
    if(!response) return null;
    var hydratedResponse = JSON.parse(response);
    if(new Date(hydratedResponse.expiresOn) < new Date())
      return null;

    return hydratedResponse.response; 
  };

  var on = function(scope, invalidateInSeconds ){
    invalidateInSeconds = invalidateInSeconds || 60*60*8;
    
    if(scope) 
      scope.after( function() { off(); });

    $._ajax = $.ajax;
    $.ajax = function(options){
      var cannedResponse = retrieveResponse(options);

      if(cannedResponse) {
        options.success(cannedResponse);
        console.log('served canned response');
      } else {
        console.log('served fresh response');
        var _success = options.success;
        options.success = function(response){
          storeResponse(options, response, invalidateInSeconds);
          _success(response);
        };
        $._ajax(options);
      }
    };
  };

  var off = function(){
    if(!$._ajax) return;

    $.ajax = $._ajax;
    delete $._ajax;
  };

  var clear = function(){
    localStorage.clear();
  };

  return {
    on: on,
    off: off,
    clearAll: clear 
  };

})();

