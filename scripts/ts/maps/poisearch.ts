namespace thdk.maps {
    export interface IPoiSearchDepenencies {
        placesService: placesservice.PlacesService;
        mapService: GoogleMapService;
        map: google.maps.Map;
    }

    export interface IPoiSearchOptions {
        markerType: MarkerType;
        markerColor?: string;
        clickEvent: (event, marker: google.maps.Marker, place: thdk.maps.placesservice.IPlaceResult) => void;
    }

    export interface IPoiSearch {
        options: IPoiSearchOptions;
        type: string;
        keyword: string;
        searchAsync(): Promise<void | placesservice.IPlaceResult[]>;
        searchBoundsAsync(bounds: google.maps.LatLngBounds): Promise<void | placesservice.IPlaceResult[]>
        toggleMarkers(show: boolean): void;
    }

    export class PoiSearch implements IPoiSearch {

        private resultsMap: string[];
        private placesService: placesservice.PlacesService;
        private mapService: GoogleMapService;
        private results: placesservice.IPlaceResult[];
        public options: IPoiSearchOptions;
        public type: string;
        public keyword: string;
        public map: google.maps.Map;

        public markers: google.maps.Marker[];

        constructor(deps: IPoiSearchDepenencies, options: IPoiSearchOptions, type = "", keyword = "") {
            this.placesService = deps.placesService;
            this.mapService = deps.mapService;
            this.map = deps.map;
            this.options = options;
            this.type = type;
            this.keyword = keyword;
            this.markers = [];
        }

        public toggleMarkers(show: boolean) {
            if (!this.markers)
                return;

            this.markers.forEach(m => {
                m.setVisible(show);
            });
        }

        public searchAsync(): Promise<void | placesservice.IPlaceResult[]> {
            return this.searchBoundsAsync(this.map.getBounds()!);
        }

        public searchBoundsAsync(bounds: google.maps.LatLngBounds): Promise<void | placesservice.IPlaceResult[]> {
            if (!this.resultsMap)
                this.resultsMap = new Array();

            if (!this.results)
                this.results = new Array();

            return this.placesService.nearbySearchAsync({ bounds: this.map.getBounds()!, keyword: this.keyword, type: this.type })
                .then(results => {
                    let newResults = results.filter(r => this.resultsMap.indexOf(r.place_id) == -1);
                    this.results = this.results.concat(newResults);

                    const ignoreTypes: string[] = ["art_gallery", "restaurant", "hotel", "store", "lodging", "real_estate_agency", "dentist", "health", "shopping_mall", "travel_agency", "parking", "bar", "cafe", "food", "bank", "finance", "bus_station", "light_rail_station", "transit_station", "general_contractor", "car_repair", "hospital", "beauty_salon"];
                    const pois: maps.placesservice.IPlaceResult[] = new Array();
                    newResults = newResults.filter(place => {
                        if (!utils.anyMatchInArray(place.types, ignoreTypes)) {
                            // TODO: configure minimum rating
                            if (place.rating > 3)
                                return true;
                        }

                        return false;
                    });
                    this.handleNearbyPlaces(newResults);
                    return newResults;
                },
                reason => {
                    console.log(reason);
                });
        }

        private handleNearbyPlaces(places: maps.placesservice.IPlaceResult[]): void {
            this.markers = this.markers.concat(places.map(place => {
                const marker = this.mapService.addMarker(place, this.map, this.options);
                // add click event
                if (this.options.clickEvent)
                    marker.addListener("click", (event) => {
                        this.options.clickEvent(event, marker, place);
                    });
                return marker;
            }));
        }
    }

    export class TypePoiSearch extends PoiSearch {
        constructor(deps: IPoiSearchDepenencies, type: string, options: IPoiSearchOptions) {
            super(deps, options, type, "");
        }
    }

    export class KeywordPoiSearch extends PoiSearch {
        constructor(deps: IPoiSearchDepenencies, keyword: string, options: IPoiSearchOptions) {
            super(deps, options, "", keyword);
        }
    }
}