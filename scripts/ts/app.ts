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

    export interface IPoiSearchMachine {
        machine: maps.IPoiSearch;
        tracking: boolean;
    }

    export class App {
        private shutterstock: stock.ShutterStock;
        private mapservice: thdk.maps.GoogleMapService;
        private map: google.maps.Map;
        private placesService: maps.placesservice.PlacesService;
        private geocodingService: maps.geocoding.GeocodingService;
        private poiSearchMachines: IPoiSearchMachine[];
        private mapSearchBox: google.maps.places.SearchBox;

        // JQUERY
        private $googlePlaceResult: JQuery;
        private $stockPhotoResult: JQuery;

        public constructor() {
            const network = new Network();
            const ssDeps: stock.IStockDepencies = {
                network: network,
                clientId: config.shutterstock.clientId,
                clientSecret: config.shutterstock.clientSecret
            };

            this.$googlePlaceResult = $("#google-place-result");
            this.$stockPhotoResult = $("#stock-photo-result");

            this.shutterstock = new stock.ShutterStock(ssDeps);
            this.mapservice = new maps.GoogleMapService(config.google.applicationId);

            this.mapservice.loadApiAsync().then(() => {
                this.map = this.mapservice.getMap("sa-map");
                this.placesService = new maps.placesservice.PlacesService(new google.maps.places.PlacesService(this.map));
                this.geocodingService = new maps.geocoding.GeocodingService(new google.maps.Geocoder());

                this.mapSearchBox = this.initMapSearch(this.map);
                this.poiSearchMachines = new Array();
                this.addSearchMachines();
                this.initMapActions(this.map);
                this.addHandlers();
            });
        }

        private addSearchMachines() {
            const poiSearchDeps: maps.IPoiSearchDepenencies = {
                map: this.map,
                mapService: this.mapservice,
                placesService: this.placesService
            };

            this.addTypeSearchMachine(poiSearchDeps, "museum", "77450b", maps.MarkerType.museum);
            this.addTypeSearchMachine(poiSearchDeps, "church", "4576cc", maps.MarkerType.church);
            this.addTypeSearchMachine(poiSearchDeps, "park", "529946", maps.MarkerType.park);
            this.addKeywordSearchMachine(poiSearchDeps, "historical", "52A6F8", maps.MarkerType.castle);
            this.addKeywordSearchMachine(poiSearchDeps, "tourist attractions", "68B74A", maps.MarkerType.photo);
        }

        private addTypeSearchMachine(poiSearchDeps: maps.IPoiSearchDepenencies, searchtype: string, markerColor: string, markerType: maps.MarkerType) {
            this.poiSearchMachines.push({ machine: new maps.TypePoiSearch(poiSearchDeps, searchtype, { markerColor, markerType, clickEvent: (event, marker, place) => this.markerClick(event, marker, place) }), tracking: false });
        }

        private addKeywordSearchMachine(poiSearchDeps: maps.IPoiSearchDepenencies, keyword: string, markerColor: string, markerType: maps.MarkerType) {
            this.poiSearchMachines.push({ machine: new maps.KeywordPoiSearch(poiSearchDeps, keyword, { markerColor, markerType, clickEvent: (event, marker, place) => this.markerClick(event, marker, place) }), tracking: false });
        }

        private addHandlers(): void {
            const $container = $("body");
            $container.on("click", "#searchButton", (e) => {
                this.findImagesAsync()
                    .then(results => this.showImageSearchResults(results));
            });

            google.maps.event.addListener(this.map, 'idle', e => this.handleMapIdle(e));
            google.maps.event.addListener(this.map, 'click', e => this.handleMapClick(e));
        }

        private markerClick(event, marker: google.maps.Marker, place: thdk.maps.placesservice.IPlaceResult) {
            this.mapClick(event, place);
            this.showPlace(place);
        }

        private handleMapIdle(event) {
            const bounds = this.map.getBounds();
            if (bounds) {
                this.mapSearchBox.setBounds(bounds);
                this.poiSearchMachines.filter(sm => sm.tracking).map(sm => sm.machine.searchBoundsAsync(this.map.getBounds()!))
            }
            else {
                // if this never happens use searchBox.setBounds(bounds!);
                alert("GOOGLE MAPS RETURNED " + bounds + " for map.getBounds.")
            }
        }

        private handleMapClick(event) {
            this.mapClick(event);
        }

        private mapClick(event, place?: maps.placesservice.IPlaceResult) {
            if (this.mapservice.infowindow)
                this.mapservice.infowindow.close();

            // get the current clicked place
            const promises = new Array();
            promises.push(this.geocodingService.geocodeAsync({ location: event.latLng }));

            if (event.placeId && !place) {
                promises.push(this.placesService.getDetailsAsync({ placeId: event.placeId }));
                event.stop();
            }

            Promise.all(promises).then(responses => {
                const query = this.generateSearchQuery(responses.length > 1 ? responses[1] : place, responses[0]);

                const oldQuery = $("#query").val()
                if (oldQuery != query)
                    this.findAndShowImagesAsync(query);
            },
                (reason) => {
                    console.log(reason);
                });
        }

        private searchPoiAsync(type: string, keyword = "", useKeywordAsFallbackMarker = false) {
            let marker = maps.MarkerType[type];
            if (!type && useKeywordAsFallbackMarker)
                marker = this.getMarkerForKeyword(keyword);

            const poiSearch = new maps.TypePoiSearch({ placesService: this.placesService, mapService: this.mapservice, map: this.map }, type, marker);
            poiSearch.searchAsync().then(places => poiSearch.markers.forEach(m => m.setIcon(m.getIcon() + "?highlight=00FF00")));
        }

        private getMarkerForKeyword(keyword: string): maps.MarkerType {
            switch (keyword) {
                case "tourist attractions":
                    return maps.MarkerType.photo;
                default:
                    return maps.MarkerType[keyword];
            }
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

            const $searchActionsList = $actionsWrapper.find(".poi-search-list");
            this.poiSearchMachines.reverse().forEach(sm => {
                const $listItem = $(`<li><span class="${sm.machine.type}"></span></li>`);
                $listItem.find("span").css("background-image", "url(" + this.mapservice.getIconUrlForMarkerType(sm.machine.options, 1.5) + ")");
                $listItem.on("click", "span", (e) => {
                    const $span = $(e.currentTarget);
                    if (sm.machine.type || sm.machine.keyword) {
                        // toggle map tracking on this search machine
                        sm.tracking = !sm.tracking;

                        // hide or show previous markers
                        sm.machine.toggleMarkers(sm.tracking);

                        // trigger search for the current bounds of the map
                        if (sm.tracking)
                            sm.machine.searchAsync();
                    } else {
                        // show the search box
                        $span.parent().find(".custom-search-wrapper").show();
                    }
                });
                $searchActionsList.prepend($listItem);
            });

            $actionsWrapper.on("click", ".search-icon", (e) => {
                const $span = $(e.currentTarget);
                this.searchPoiAsync("", $span.prev().val());
            })
        }

        private initMapSearch(map: google.maps.Map): google.maps.places.SearchBox {
            // Create the search box and link it to the UI element.
            const input = <HTMLInputElement>document.getElementById('pac-input');
            const inputWrapper = <HTMLInputElement>document.getElementById('pac-input-wrapper');
            const searchBox = new google.maps.places.SearchBox(input);

            map.controls[google.maps.ControlPosition.TOP_LEFT].push(inputWrapper);

            let markers: google.maps.Marker[] = [];
            // Listen for the event fired when the user selects a prediction and retrieve
            // more details for that place.
            searchBox.addListener('places_changed', () => {
                const places = searchBox.getPlaces();

                if (places.length == 0) {
                    return;
                }

                // Clear out the old markers.
                markers.forEach(marker => {
                    marker.setMap(null);
                });
                markers = [];

                // For each place, get the icon, name and location.
                const bounds = new google.maps.LatLngBounds();
                places.forEach(place => {
                    if (!place.geometry) {
                        console.log("Returned place contains no geometry");
                        return;
                    }
                    const icon = {
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

            return searchBox;
        }

        private loadInfoWindowAsync(latLng: google.maps.LatLng, placeId: string): Promise<google.maps.InfoWindow> {
            return this.placesService.getDetailsAsync({ placeId }).then(poi => {
                this.showInfoWindowForPlace(poi);
                return this.mapservice.infowindow;
            });
        }

        private showInfoWindowForPlace(place: google.maps.places.PlaceResult) {
            this.mapservice.infowindow.setContent(this.getInfoWindowContentForPlace(place));
            this.mapservice.infowindow.open(this.map);
            this.mapservice.infowindow.setPosition(new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng()));
        }

        private showPlace(place: google.maps.places.PlaceResult) {
            this.$googlePlaceResult.show();
            this.$googlePlaceResult.find(".name").html(place.name);
            this.$googlePlaceResult.find(".images").empty().append(this.getPhotosForPlace(place));
        }

        private getPhotosForPlace(place): JQuery {
            if (!place.photos)
                return $("");

            return place.photos.map(photo => {
                return $(`<img src="${photo.getUrl({ maxHeight: 600, maxWidth: 600 })}"/>`);
            })
        }
        private getInfoWindowContentForPlace(place: maps.placesservice.IPlaceResult): string {
            let content = '<div class="info-window">';
            if (place.photos) {
                content += '<div class="iw-imageholder">';
                content += '<img src="' + place.photos[0].getUrl({ maxHeight: 200, maxWidth: 200 }) + '"/>';
                content += '</div>'
            }
            content += '<div class="iw-title">' + place.name + '</div>'
            content += '</div>';

            return content;
        }

        private findAndShowImagesAsync(query): Promise<any> {
            $("#query").val(query);
            return this.shutterstock.findAsync(query)
                .then(imageResults => this.showImageSearchResults(imageResults));
        }

        private generateSearchQuery(place: google.maps.places.PlaceResult, geocoderResults: google.maps.GeocoderResult[] | Falsy): string {
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
            this.$stockPhotoResult.find(".no-results").toggle(!results.data.length);

            const $container = this.$stockPhotoResult.find("#imagecontainer");
            $container.empty();

            if (!results.data)
                return;

            results.data.forEach(imgData => {
                if (imgData.assets && imgData.assets.preview !== undefined) {
                    const imagedata = imgData.assets.preview;
                    var img = document.createElement('img');
                    img.setAttribute("src", imagedata.url);
                    $container.append(img);
                }
            });

        }
    }
    window.onload = function () {
        const stockartoApp = new App();
    };
}
