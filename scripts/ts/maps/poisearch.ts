namespace thdk.maps {
export interface IPoiDepenencies {
    placesService: placesservice.PlacesService;
    icons: 
}

    export interface IPoiSearch {
        searchAsync(bounds: google.maps.Map): Promise<placesservice.IPlaceResult[]>;
    }

    export class PoiSearch implements IPoiSearch {
        private markers: google.maps.Marker[];
        private resultsMap: string[];
        private placesService: placesservice.PlacesService;
        private keyword: string;
        private results: placesservice.IPlaceResult[];

        public type: string;

        constructor(placesservice: placesservice.PlacesService, type = "", keyword = "") {
            this.placesService = placesservice;
        }

        public searchAsync(map: google.maps.Map): Promise<placesservice.IPlaceResult[]> {
            if (!this.resultsMap)
                this.resultsMap = new Array();

            if (!this.results)
                this.results = new Array();

            return this.placesService.nearbySearchAsync({ bounds: map.getBounds(), keyword: this.keyword, type: this.type }).then(results => {
                const newResults = results.filter(r => this.resultsMap.indexOf(r.place_id) == -1);
                this.results = this.results.concat(newResults);
                return newResults;
            });
        }
    }

    export class TypePoiSearch extends PoiSearch {
        constructor(placesservice: placesservice.PlacesService, type: string) {
            super(placesservice, "", type);
        }
    }
}