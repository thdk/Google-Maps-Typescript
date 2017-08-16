namespace thdk.maps.geocoding {
    export interface IPlaceDetailsRequest extends google.maps.places.PlaceDetailsRequest {        
    }

    export interface IPlaceResult extends google.maps.places.PlaceResult {        
    }

    export interface IPlaceDetailsResponse {        
        result: google.maps.places.PlaceResult;
        status: google.maps.places.PlacesServiceStatus;
    }

    export class GeocodingService {
        private service: google.maps.Geocoder;

        constructor(service: google.maps.Geocoder) {
            this.service = service;
        }

        public geocodeAsync(request: google.maps.GeocoderRequest): Promise<google.maps.GeocoderResult[]> {
            const deferred = new Deferred<google.maps.GeocoderResult[]>();
            
            this.service.geocode(request, (results, status) => {
                if (status == google.maps.GeocoderStatus.OK) {
                    deferred.resolve(results);
                } else {
                    deferred.reject(status);
                }
            });

            return deferred.promise;
        }
    }
}