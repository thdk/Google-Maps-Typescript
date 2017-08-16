namespace thdk.maps.placesservice {
    export interface IPlaceDetailsRequest extends google.maps.places.PlaceDetailsRequest {        
    }

    export interface IPlaceResult extends google.maps.places.PlaceResult {        
    }

    export interface IPlaceDetailsResponse {        
        result: google.maps.places.PlaceResult;
        status: google.maps.places.PlacesServiceStatus;
    }

    export class PlacesService {
        private service: google.maps.places.PlacesService;

        constructor(service: google.maps.places.PlacesService) {
            this.service = service;
        }

        public getDetailsAsync(request: IPlaceDetailsRequest): Promise<IPlaceResult> {
            const deferred = new Deferred<IPlaceResult>();

            this.service.getDetails(request, (result, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    deferred.resolve(result);
                }
                else {
                    deferred.reject(status);
                }
            });

            return deferred.promise;
        }
    }
}