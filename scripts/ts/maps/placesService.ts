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
            return new Promise<IPlaceResult>((resolve, reject) => {
                this.service.getDetails(request, (result, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        resolve(result);
                    }
                    else {
                        reject(status);
                    }
                });
            });
        }
    }
}