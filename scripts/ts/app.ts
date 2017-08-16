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
                                const query = this.generateSearchQuery(results);
                                $("#query").val(query);
                                const images = this.shutterstock.findAsync(query)
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

        private generateSearchQuery(geocoderResults: google.maps.GeocoderResult[]): string {
            console.log(geocoderResults);
            console.log(geocoderResults[0].address_components);
            const usefulTypeOrder: string[] = ["point_of_interest", "locality", "administrative_area_level_2"];
            const ignoreTypes: string[] = new Array();
            const usefulGeocoderResult: google.maps.GeocoderResult[] = new Array();
            usefulTypeOrder.forEach(type => {
                geocoderResults.forEach(result => {
                    if (!utils.anyMatchInArray(result.types, ignoreTypes)) {

                        const match = utils.findFirst(result.types, t => t === type);
                        if (match)
                            usefulGeocoderResult.push(result);
                    }
                });
            });

            const query = usefulGeocoderResult[0].address_components[0].short_name;
            return query;
        }

        private findImagesAsync(): Promise<shutterstock.ImageSearchResults> {
            const q = $('#query').val();
            return this.shutterstock.findAsync(q);
        }

        private showImageSearchResults(results: shutterstock.ImageSearchResults) {
            if (!results.data.length)
                return;

            const $container = $("#imagecontainer");
            $container.empty();

            results.data.forEach(imgData => {
                const imagedata = imgData.assets.preview;
                var img = document.createElement('img');
                img.setAttribute("src", imagedata.url);
                $container.append(img);
            });

        }
    }

    const stockartoApp = new App();
    stockartoApp.start();
}
