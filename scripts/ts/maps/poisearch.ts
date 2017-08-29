namespace thdk.maps {
    export interface IPoiSearchDepenencies {
        placesService: placesservice.PlacesService;
        mapService: GoogleMapService;
        map: google.maps.Map;
    }

    export interface IPoiSearchOptions {
        markerType: MarkerType;
        markerColor?: string;
    }

    export interface IPoiSearch {
        type: string;
        searchAsync(): Promise<void | placesservice.IPlaceResult[]>;
    }

    export class PoiSearch implements IPoiSearch {

        private resultsMap: string[];
        private placesService: placesservice.PlacesService;
        private mapService: GoogleMapService;
        private keyword: string;
        private results: placesservice.IPlaceResult[];
        private options: IPoiSearchOptions;

        public type: string;
        public map: google.maps.Map;

        public markers: google.maps.Marker[];

        constructor(deps: IPoiSearchDepenencies, options: IPoiSearchOptions, type = "", keyword = "") {
            this.placesService = deps.placesService;
            this.mapService = deps.mapService;
            this.map = deps.map;
            this.options = options;
            this.type = type;
        }

        public searchAsync(): Promise<void | placesservice.IPlaceResult[]> {
            if (!this.resultsMap)
                this.resultsMap = new Array();

            if (!this.results)
                this.results = new Array();

            return this.placesService.nearbySearchAsync({ bounds: this.map.getBounds()!, keyword: this.keyword, type: this.type })
                .then(results => {
                    const newResults = results.filter(r => this.resultsMap.indexOf(r.place_id) == -1);
                    this.results = this.results.concat(newResults);
                    // todo: filter newResults

                    this.handleNearbyPlaces(newResults);
                    return newResults;
                },
                reason => {
                    console.log(reason);
                });
        }

        private handleNearbyPlaces(places: maps.placesservice.IPlaceResult[]): void {
            this.markers = places.map(place => this.mapService.addMarker(place, this.map, this.options));
        }
    }

    export class TypePoiSearch extends PoiSearch {
        constructor(deps: IPoiSearchDepenencies, type: string, options: IPoiSearchOptions) {
            super(deps, options, type, "");
        }
    }
}