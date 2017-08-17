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
        private place: google.maps.places.PlaceResult;
        private geocoderResults: google.maps.GeocoderResult[];

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
                const placesService = new maps.placesservice.PlacesService(new google.maps.places.PlacesService(map));
                const geocodingService = new maps.geocoding.GeocodingService(new google.maps.Geocoder());

                google.maps.event.addListener(map, 'click', (event) => {
                    this.place = null;
                    this.geocoderResults = new Array();

                    const promises = new Array();
                    if (event.placeId) {
                        promises.push(placesService.getDetailsAsync({ placeId: event.placeId })
                            .then(result => {
                                this.place = result;
                            })
                        );
                        event.stop();
                    }

                    promises.push(geocodingService.geocodeAsync({ location: event.latLng })
                        .then(results => {
                            this.geocoderResults = results;
                        }));

                    Promise.all(promises).then(() => {
                        let query = this.generateSearchQuery(this.geocoderResults);
                        if (this.place)
                            query = this.place.name + " " + query;

                        this.findAndShowImagesAsync(query);
                    });
                });
            });
        }

        private findAndShowImagesAsync(query): Promise<any> {
            $("#query").val(query);
            return this.shutterstock.findAsync(query)
                .then(imageResults => this.showImageSearchResults(imageResults));
        }

        private generateSearchQuery(geocoderResults: google.maps.GeocoderResult[]): string {
            const usefulTypeOrder: string[] = ["locality", "administrative_area_level_2"];
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

        private getLocality(addresses: google.maps.GeocoderAddressComponent[]): string {
            return addresses.filter(a => a.types.indexOf("locality") !== -1)
                .map(a => a.short_name)[0];
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
