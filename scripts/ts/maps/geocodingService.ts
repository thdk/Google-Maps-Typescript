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
            return new Promise((resolve, reject) => {
                this.service.geocode(request, (results, status) => {
                    if (status == google.maps.GeocoderStatus.OK)
                        resolve(results);
                    else
                        reject(status);
                });
            });
        }
    }
}