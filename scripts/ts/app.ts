namespace thdk.stockarto {
    export class App {
        public start(): void {
this.initMap();
        }

        private initMap(): void {
            var map = new thdk.googlemaps.GoogleMaps();
            map.loadApiAsync().then(success => {
                console.log("succes"); 
            },
         failure => {
            console.log("false"); 
         });
        }
    }

    const stockartoApp = new App();
    stockartoApp.start();
}
