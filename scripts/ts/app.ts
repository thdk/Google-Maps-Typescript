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
                const placesService = new maps.placesservice.PlacesService(new google.maps.places.PlacesService(map));
                const geocodingService = new maps.geocoding.GeocodingService(new google.maps.Geocoder());

                this.initMapSearch(map);
                google.maps.event.addListener(map, 'click', (event) => {

                    const promises = new Array();
                    promises.push(geocodingService.geocodeAsync({ location: event.latLng }));
                    promises.push(placesService.nearbySearchAsync({ location: event.latLng, radius: 30, type: "point_of_interest" }));

                    if (event.placeId) {
                        promises.push(placesService.getDetailsAsync({ placeId: event.placeId }));
                        event.stop();
                    }

                    Promise.all(promises).then(responses => {
                        let query = this.generateSearchQuery(responses.length > 2 ? responses[2] : null, responses[0]);
                        const nearbyPlaces: maps.placesservice.IPlaceResult[] = responses[1];

                        const ignoreTypes: string[] = ["restaurant", "hotel", "store", "lodging", "real_estate_agency", "dentist", "health", "shopping_mall", "travel_agency", "parking", "bar"];
                        nearbyPlaces.forEach(element => {
                            if (!utils.anyMatchInArray(element.types, ignoreTypes)) {
                                // if types.lenght = 2 and one of them equals establishement, (the other one is POI) then skip this
                                if (element.types.length !== 2 || element.types.indexOf("establishment") === -1) {
                                    mapservice.addMarker(element, map);
                                    element.types.forEach(t => {
                                        console.log(element.name + ": " + t);
                                    });
                                }
                            }
                        });

                        this.findAndShowImagesAsync(query);
                    },
                        (reason) => {
                            console.log(reason);
                        });
                });
            });
        }

        private initMapSearch(map: google.maps.Map) {
            // Create the search box and link it to the UI element.
            var input = <HTMLInputElement>document.getElementById('pac-input');
            var inputWrapper = <HTMLInputElement>document.getElementById('pac-input-wrapper');
            var searchBox = new google.maps.places.SearchBox(input);

            map.controls[google.maps.ControlPosition.TOP_LEFT].push(inputWrapper);

            // Bias the SearchBox results towards current map's viewport.
            map.addListener('bounds_changed', () => {
                searchBox.setBounds(map.getBounds());
            });

            var markers = [];
            // Listen for the event fired when the user selects a prediction and retrieve
            // more details for that place.
            searchBox.addListener('places_changed', () => {
                var places = searchBox.getPlaces();

                if (places.length == 0) {
                    return;
                }

                // Clear out the old markers.
                markers.forEach(marker => {
                    marker.setMap(null);
                });
                markers = [];

                // For each place, get the icon, name and location.
                var bounds = new google.maps.LatLngBounds();
                places.forEach(place => {
                    if (!place.geometry) {
                        console.log("Returned place contains no geometry");
                        return;
                    }
                    var icon = {
                        url: place.icon,
                        size: new google.maps.Size(71, 71),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(17, 34),
                        scaledSize: new google.maps.Size(25, 25)
                    };

                    // Create a marker for each place.
                    markers.push(new google.maps.Marker({
                        map: map,
                        icon: icon,
                        title: place.name,
                        position: place.geometry.location
                    }));

                    if (place.geometry.viewport) {
                        // Only geocodes have viewport.
                        bounds.union(place.geometry.viewport);
                    } else {
                        bounds.extend(place.geometry.location);
                    }
                });

                if (places.length) {
                    // use first (and only?) place to load images
                    this.findAndShowImagesAsync(this.generateSearchQuery(places[0], null));
                }

                map.fitBounds(bounds);
            });
        }

        private findAndShowImagesAsync(query): Promise<any> {
            if (query === $("#query").val())
                return;

            $("#query").val(query);
            return this.shutterstock.findAsync(query)
                .then(imageResults => this.showImageSearchResults(imageResults));
        }

        private generateSearchQuery(place: google.maps.places.PlaceResult, geocoderResults: google.maps.GeocoderResult[]): string {
            let query = "";

            if (geocoderResults) {
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

                query = usefulGeocoderResult[0].address_components[0].short_name
            }

            // Todo: make addition of placename optional
            // Todo: what else can be used of the place properties?
            if (place && query.indexOf(" " + place.name) == -1)
                query = place.name + " " + query;

            return query.trim();
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
