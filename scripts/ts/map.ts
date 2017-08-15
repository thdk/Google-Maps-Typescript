namespace thdk.googlemaps {
    export interface IMap {
        
    }

    export class GoogleMapService {
        private apiLoaderPromise:Promise<boolean>;
        private deferred:Deferred<boolean>;
        private apikey: string;
        private callbackname: string;

        constructor(apiKey: string) {
            this.apikey = apiKey;
        }

        private resolve() {
            this.deferred.resolve(typeof google === 'object' && typeof google.maps === 'object' ? google.maps : false );
        }

        public loadApiAsync(): Promise<boolean> {
            if (this.apiLoaderPromise)
                return this.apiLoaderPromise;

            this.deferred = new Deferred();  

            //If google.maps exists, then Google Maps API was probably loaded with the <script> tag
		    if (typeof google === 'object' && typeof google.maps === 'object') {			
                this.resolve();
            }
        
            const now = new Date().getMilliseconds().toString();
            this.callbackname = "loadGoogleMaps_" + now;

            const params = {
                "key": this.apikey,
                "callback" : this.callbackname
            };

            window[this.callbackname] = () => {
                this.resolve();
                setTimeout(function() {
					try{
						delete window[this.callbackName];
					} catch( e ) {}
				}, 20);
            };

            //Can't use the jXHR promise because 'script' doesn't support 'callback=?'
			// $.ajax({
			// 	dataType: 'script',
			// 	data: params,
			// 	url: 'http://maps.google.com/maps/api/js'				
            // });
            
            let filename = "http://maps.google.com/maps/api/js";
            filename += "?key=" + this.apikey;
            filename += "&callback=" + this.callbackname;
            var fileref=document.createElement('script');
            fileref.setAttribute("type","text/javascript");
            fileref.setAttribute("src", filename);
            document.body.appendChild(fileref);

            this.apiLoaderPromise = this.deferred.promise;
            return this.apiLoaderPromise;
        }
        
        public getMap(id: string): google.maps.Map {
            return new google.maps.Map(document.getElementById(id), {
                center: {lat: -34.397, lng: 150.644},
                zoom: 8
             });
        }
    }
}