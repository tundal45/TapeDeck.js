describe("jasmine-vcr", function(){
  //helpers
  var callServer = function(successCallback) {
    $.ajax({
      url: '/apicall',
      success: successCallback,
      error: function(err) {
        console.error(err);
      }
    });
  };

  beforeEach(function(){
    localStorage.clear();
      
    return this.addMatchers({
      toDeeplyEqual: function(expected) {
        return _.isEqual(expected, this.actual);
      }
    });
  });

  describe("on", function(){
    it("new request caches response", function(){
      jasmine.vcr.on(this);
      
      expect(localStorage.length).toBe(0);
      
      var response = null;
      callServer(function(resp){
        response = resp;
      });
      
      waitsFor(function(){ return response !== null; });

      runs(function(){
        expect(localStorage.length).toBe(1);
        var storedResponse = localStorage.getItem(localStorage.key(0));
        var hydratedResponse = JSON.parse(storedResponse);
        expect(response).toDeeplyEqual(hydratedResponse.response);
      });

    });

    it("expired request", function(){
      jasmine.vcr.on(this);
     
      localStorage.setItem('{"url":"/apicall"}', '{"expiresOn":"1900-02-13T22:50:01.532Z","response":{"data":9}}');

      var response = null;
      callServer(function(resp){
        response = resp;
      });
      
      waitsFor(function(){ return response !== null; });

      runs(function(){
        expect(response.data).toBe(5);
      });
    });

    it("stored unexpired request", function(){
      jasmine.vcr.on(this);
      var year = (new Date()).getFullYear() + 1;
      localStorage.setItem('{"url":"/apicall"}', '{"expiresOn":"' + year + '-02-13T22:50:01.532Z","response":{"data":100}}');

      var response = null;
      callServer(function(resp){
        response = resp;
      });
      
      waitsFor(function(){ return response !== null; });

      runs(function(){
        expect(response.data).toBe(100);
      });
    });

  });
    
  describe("clearAll", function(){
    it("can clear all stored requests", function(){
      jasmine.vcr.on(this);
      var called = false;
      callServer(function(){
        called = true;
      });
      
      waitsFor(function(){ return called === true; });

      runs(function(){
        expect(localStorage.length).toBe(1); 
        jasmine.vcr.clearAll();
        expect(localStorage.length).toBe(0);
      });
    });
  });

  describe("off", function(){
    it("can be turned on and off without conflict", function(){
      jasmine.vcr.on();
      
      var response = null;
      callServer(function(resp){
        response = resp;
      });
      
      waitsFor(function(){ return response !== null; });
      
      runs(function(){
        
        expect(localStorage.length).toBe(1); 
        jasmine.vcr.off();
         
        $.ajax({
          url: '/apicall',
          otherThing: 'dummy',
          success: function(resp){
            response = resp;
          }
        });
        
        waitsFor(function(){ return response !== null; });
        
        runs(function(){
          expect(localStorage.length).toBe(1);
        });
      });
    });
  });
});

