namespace thdk.maps.placesservice {
    export interface IPlaceDetailsRequest extends google.maps.places.PlaceDetailsRequest {
    }

    export interface IPlaceResult extends google.maps.places.PlaceResult {
    }

    export interface IPlaceDetailsResponse {
        result: google.maps.places.PlaceResult;
        status: google.maps.places.PlacesServiceStatus;
    }

    export type PriceLevel = 0 | 1 | 2 | 3 | 4;

    export interface INearbySearchRequest extends google.maps.places.PlaceSearchRequest { }

    export interface INearbySearchResult {
        places: IPlaceResult[];
        pagination: any;
    }

    export interface ITextSearchRequest extends google.maps.places.TextSearchRequest { }

    export class PlacesService {
        private service: google.maps.places.PlacesService;

        constructor(service: google.maps.places.PlacesService) {
            this.service = service;
        }

        public getDetailsAsync(request: IPlaceDetailsRequest): Promise<IPlaceResult> {
            return new Promise<IPlaceResult>((resolve, reject) => {
                this.service.getDetails(request, (result, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        resolve(result);
                    }
                    else {
                        reject("getDetails failed: " + status);
                    }
                });
            });
        }

        public textSearchAsync(request: ITextSearchRequest): Promise<IPlaceResult[]> {
            return new Promise<IPlaceResult[]>((resolve, reject) => {
                this.service.textSearch(request, (result, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        resolve(result);
                    }
                    else {
                        reject("getDetails failed: " + status);
                    }
                });
            });
        }

        public nearbySearchAsync(request: INearbySearchRequest): Promise<IPlaceResult[]> {
            let nearbyResults = new Array();
            return new Promise<IPlaceResult[]>((resolve, reject) => {
                this.service.nearbySearch(request, (results, status, pagination) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK || status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        nearbyResults = nearbyResults.concat(results);
                        // temporary disable pagination
                        if (pagination.hasNextPage && true)
                            pagination.nextPage();
                        else {
                            resolve(nearbyResults);
                        }
                    }
                    else {
                        reject("nearbySearch failed: " + status);
                    }
                });
            });
        }
    }
}