namespace thdk.stockarto {
    declare const $: any;
    declare const loadGoogleMaps: any;
    declare const config: IAppConfig;

    export interface IAppConfig {
        googleapikey:string;
    }

    export class App {
        public start(): void {            
         this.initMap();
        }

        private initMap(): void {
            const mapservice = new thdk.googlemaps.GoogleMaps(config.googleapikey);
            mapservice.loadApiAsync().then(success => {
                mapservice.getMap("sa-map");
            },
            failure => {
                console.log("false"); 
            });
        }
    }

    const stockartoApp = new App();
    stockartoApp.start();
}
