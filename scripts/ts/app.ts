namespace thdk.stockarto {
    declare const config: IAppConfig;

    export interface IAppConfig {
        google: {
            applicationId: string;
            geocoding: {
                apiKey: string;
            }
        },
        shutterstock: {
            clientId: string;
            clientSecret: string;
        }
    }

    export class App {
        private shutterstock: stock.ShutterStock;
        public start(): void {
            const network = new Network();
            const ssDeps: stock.IStockDepencies = {
                network: network,
                clientId: config.shutterstock.clientId,
                clientSecret: config.shutterstock.clientSecret
            };

            this.shutterstock = new stock.ShutterStock(ssDeps);

            this.initMap();
            this.addHandlers();
        }

        private addHandlers(): void {
            const $container = $("body");
            $container.on("click", "#searchButton", (e) => {
                this.findImagesAsync()
                    .then(results => this.showImageSearchResults(results));
            });
        }

        private initMap(): void {
            const mapservice = new googlemaps.GoogleMapService(config.google.applicationId);
            mapservice.loadApiAsync().then(success => {
                const map = mapservice.getMap("sa-map");

                google.maps.event.addListener(map, 'click', (event) => {
                    const geocoder = new google.maps.Geocoder();

                    const request: google.maps.GeocoderRequest = {
                        location: event.latLng
                    };
                    geocoder.geocode(request, (results, status) => {
                        if (status == google.maps.GeocoderStatus.OK) {
                            if (results[1]) {
                                console.log(results[1].formatted_address);
                                // 
                                const images = this.shutterstock.findAsync(results[1].address_components[0].short_name)
                                    .then(imageResults => this.showImageSearchResults(imageResults));
                                ;
                            }
                        } else {
                            alert("Geocoder failed due to: " + status);
                        }
                    });
                });

            },
                failure => {
                    console.log("false");
                });
        }

        private findImagesAsync(): Promise<shutterstock.ImageSearchResults> {
            const q = $('#query').val();
            return this.shutterstock.findAsync(q);
        }

        private showImageSearchResults(results: shutterstock.ImageSearchResults) {
            const container = document.getElementById("imagecontainer");
            const imagedata = results.data[1].assets.preview;
            var img = document.createElement('img');
            img.setAttribute("type", "text/javascript");
            img.setAttribute("src", imagedata.url);
            img.setAttribute("height", imagedata.height.toString());
            img.setAttribute("width", imagedata.width.toString());
            container.appendChild(img);
        }
    }

    const stockartoApp = new App();
    stockartoApp.start();
}
