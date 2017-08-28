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
        private mapservice: thdk.maps.GoogleMapService;
        private map: google.maps.Map;
        private placesService: maps.placesservice.PlacesService;
        private geocodingService: maps.geocoding.GeocodingService;

        public start(): void {
            const network = new Network();
            const ssDeps: stock.IStockDepencies = {
                network: network,
                clientId: config.shutterstock.clientId,
                clientSecret: config.shutterstock.clientSecret
            };

            this.shutterstock = new stock.ShutterStock(ssDeps);
            this.mapservice = new maps.GoogleMapService(config.google.applicationId);

            this.initMapAsync().then(() => {
                this.placesService = new maps.placesservice.PlacesService(new google.maps.places.PlacesService(this.map));
                this.geocodingService = new maps.geocoding.GeocodingService(new google.maps.Geocoder());
            });
            this.addHandlers();
        }

        private addHandlers(): void {
            const $container = $("body");
            $container.on("click", "#searchButton", (e) => {
                this.findImagesAsync()
                    .then(results => this.showImageSearchResults(results));
            });
        }

        private initMapAsync(): Promise<void> {
            return this.mapservice.loadApiAsync().then(success => {
                this.map = this.mapservice.getMap("sa-map");
                this.initMapSearch(this.map);
                this.initMapActions(this.map);
                google.maps.event.addListener(this.map, 'click', (event) => this.handleMapClick(event));
            });
        }

        private handleMapClick(event) {
            // get the current clicked place
            const promises = new Array();
            promises.push(this.geocodingService.geocodeAsync({ location: event.latLng }));

            if (event.placeId) {
                promises.push(this.placesService.getDetailsAsync({ placeId: event.placeId }));
                event.stop();
            }

            Promise.all(promises).then(responses => {
                const query = this.generateSearchQuery(responses.length > 1 ? responses[1] : null, responses[0]);
                this.findAndShowImagesAsync(query);
            },
                (reason) => {
                    console.log(reason);
                });
        }

        private getNearbyPlacesAsync(latLng: google.maps.LatLng) {
            // promises.push(placesService.textSearchAsync({query: "point of interest", location: event.latLng, radius: 3000}));
            const radius = 3000;
            this.placesService.nearbySearchAsync({ location: latLng, keyword: "historical", rankBy: google.maps.places.RankBy.DISTANCE })
                .then(places => this.handleNearbyPlaces(places, maps.MarkerType.castle), (reason) => console.log(reason));

            // this.placesService.nearbySearchAsync({ location: latLng, keyword: "bridge", rankBy: google.maps.places.RankBy.DISTANCE })
            //     .then(places => this.handleNearbyPlaces(places, googlemaps.MarkerType.castle), (reason) => console.log(reason));

            // this.placesService.nearbySearchAsync({ location: latLng, type: "church", radius })
            //     .then(places => this.handleNearbyPlaces(places, googlemaps.MarkerType.church), (reason) => console.log(reason));

            // this.placesService.nearbySearchAsync({ location: latLng, type: "synagogue", radius })
            //     .then(places => this.handleNearbyPlaces(places, googlemaps.MarkerType.synagogue), (reason) => console.log(reason));

            // this.placesService.nearbySearchAsync({ location: latLng, type: "museum", radius })
            //     .then(places => this.handleNearbyPlaces(places, googlemaps.MarkerType.museum), (reason) => console.log(reason));

            this.placesService.nearbySearchAsync({ location: latLng, type: "park", radius })
                .then(places => this.handleNearbyPlaces(places, maps.MarkerType.park), (reason) => console.log(reason));

            // this.placesService.nearbySearchAsync({ location: latLng, type: "monument", radius })
            //     .then(places => this.handleNearbyPlaces(places, googlemaps.MarkerType.park), (reason) => console.log(reason));
        }

        private searchPoiAsync(type: string, keyword = "", useKeywordAsFallbackMarker = false) {
            let marker = maps.MarkerType[type];
            if (!type && useKeywordAsFallbackMarker)
                marker = this.getMarkerForKeyword(keyword);
            
            const poiSearch = new maps.TypePoiSearch({placesService: this.placesService, mapService: this.mapservice, map: this.map}, type, marker);
            poiSearch.searchAsync().then(places => poiSearch.markers.forEach(m => m.setDraggable(true)));

            // this.placesService.nearbySearchAsync({ bounds: this.map.getBounds(), type: type, keyword })
            //     .then(places => this.handleNearbyPlaces(places, marker), reason => console.log(reason));
        }

        private getMarkerForKeyword(keyword: string): maps.MarkerType {
            switch (keyword) {
                case "tourist attractions":
                    return maps.MarkerType.photo;
                default:
                    return maps.MarkerType[keyword];
            }
        }

        private handleNearbyPlaces(places: maps.placesservice.IPlaceResult[], markertype: maps.MarkerType): void {
            const ignoreTypes: string[] = ["art_gallery", "restaurant", "hotel", "store", "lodging", "real_estate_agency", "dentist", "health", "shopping_mall", "travel_agency", "parking", "bar", "cafe", "food", "bank", "finance", "bus_station", "light_rail_station", "transit_station", "general_contractor", "car_repair", "hospital", "beauty_salon"];
            const pois: maps.placesservice.IPlaceResult[] = new Array();
            places.forEach(place => {
                if (!utils.anyMatchInArray(place.types, ignoreTypes)) {
                    // TODO: configure minimum rating
                    if (place.rating > 3)
                        pois.push(place);
                }
            });

            pois.forEach(poi => {
                const marker = this.mapservice.addMarker(poi, this.map, markertype);
                google.maps.event.addListener(marker, 'click', (e) => this.loadInfoWindowAsync(e.latLng, poi.place_id));
            });
        }

        private initMapActions(map: google.maps.Map) {
            // Create the search box and link it to the UI element.
            const actionsWrapper = <HTMLInputElement>document.getElementById('actions-wrapper');
            map.controls[google.maps.ControlPosition.LEFT_CENTER].push(actionsWrapper);
            const $actionsWrapper = $(actionsWrapper);
            $actionsWrapper.on("mouseenter", ".search", (e) => {
                $(e.currentTarget).find("ul").show();
            }).on("mouseleave", ".search", (e) => {
                $(e.currentTarget).find("ul").hide();
            });

            $actionsWrapper.on("click", ".search span", (e) => {
                const $span = $(e.currentTarget);
                const type = $span.attr("data-type");
                const keyword = $span.attr("data-keyword");
                if (type || keyword) {
                    this.searchPoiAsync(type, keyword, true);
                } else {
                    // show the search box
                    $span.parent().find(".custom-search-wrapper").show();
                }
            });

            $actionsWrapper.on("click", ".search-icon", (e) => {
                const $span = $(e.currentTarget);
                this.searchPoiAsync(null, $span.prev().val());
            })
        }

        private initMapSearch(map: google.maps.Map) {
            // Create the search box and link it to the UI element.
            var input = <HTMLInputElement>document.getElementById('pac-input');
            var inputWrapper = <HTMLInputElement>document.getElementById('pac-input-wrapper');
            var searchBox = new google.maps.places.SearchBox(input);

            map.controls[google.maps.ControlPosition.TOP_LEFT].push(inputWrapper);

            // Bias the SearchBox results towards current map's viewport.
            map.addListener('bounds_changed', (e) => {
                console.log(e);
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

        private loadInfoWindowAsync(latLng: google.maps.LatLng, placeId: string) {
            this.placesService.getDetailsAsync({ placeId }).then(poi => {
                this.mapservice.infowindow.setContent(this.getInfoWindowContentForPlace(poi));
                this.mapservice.infowindow.open(this.map);
                this.mapservice.infowindow.setPosition(latLng);
            });
        }

        private getInfoWindowContentForPlace(place: maps.placesservice.IPlaceResult): string {
            let content = '<div class="info-window">';
            if (place.photos) {
                content += '<div class="iw-imageholder">';
                content += '<img src="' + place.photos[0].getUrl({ maxHeight: 350, maxWidth: 350 }) + '"/>';
                content += '</div>'
            }
            content += '<div class="iw-title">' + place.name + '</div>'
            content += '</div>';

            return content;
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

                if (usefulGeocoderResult.length)
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
