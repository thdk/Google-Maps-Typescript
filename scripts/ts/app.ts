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
         Network.post("http://httpbin.org/post",true)
         .then((data) => {
             console.log(data);
         });
        }

        private initMap(): void {
            const mapservice = new googlemaps.GoogleMapService(config.googleapikey);
            mapservice.loadApiAsync().then(success => {
                const map = mapservice.getMap("sa-map");
            },
            failure => {
                console.log("false"); 
            });
        }
    }

    const stockartoApp = new App();
    stockartoApp.start();
}
