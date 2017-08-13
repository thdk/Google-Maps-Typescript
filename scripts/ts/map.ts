namespace thdk.googlemaps {
    export interface IMap {
        
    }

    export class GoogleMaps {
        private apiLoaderPromise:Deferred<boolean>;

        public loadApiAsync(): Promise<boolean> {
            this.apiLoaderPromise = new Deferred();          
            
            this.checkApi();

            return this.apiLoaderPromise.promise;
        }

        private checkApi() {
            if (typeof google === 'object' && typeof google.maps === 'object') {
                this.apiLoaderPromise.resolve(true);
            } else {
                const script = document.createElement("script");
                script.type = "text/javascript";
                script.src = "http://maps.google.com/maps/api/js?sensor=false";
                document.body.appendChild(script);
                setTimeout(()=> {
                    this.checkApi();
                  }, 500);
               
            }
        }       
    }
}