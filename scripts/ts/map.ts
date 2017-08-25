namespace thdk.googlemaps {
    export interface IMap {

    }

    export enum MarkerType {
        castle,
        poi,
        church,
        monument,
        synagogue,
        park,
        museum
    }

    export class GoogleMapService {
        private apiLoaderPromise: Promise<boolean>;
        private deferred: Deferred<boolean>;
        private apikey: string;
        private callbackname: string;
        private icons: IStringKeyValue<string>;

        constructor(apiKey: string) {
            this.apikey = apiKey;
            this.setIcons();
        }

        private resolve() {
            this.deferred.resolve(typeof google === 'object' && typeof google.maps === 'object' ? google.maps : false);
        }

        private setIcons() {
            const iconBase = 'https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container_4x.png,icons/onion/';
            this.icons = {};
            this.icons["castle"] = iconBase + '1598-historic-building_4x.png';
            this.icons["poi"] = iconBase + '1611-japanese-poi_4x.png';
            this.icons["museum"] = iconBase + '1636-museum_4x.png';
            this.icons["church"] = iconBase + '1670-religious-christian_4x.png';
            this.icons["park"] = iconBase + '1720-tree_4x.png';
            this.icons["monument"] = iconBase + '1599-historic-monument_4x.png';
        }

        public loadApiAsync(): Promise<boolean> {
            if (this.apiLoaderPromise)
                return this.apiLoaderPromise;

            this.deferred = new Deferred();

            //If google.maps exists, then Google Maps API was probably loaded with the <script> tag
            if (typeof google === 'object' && typeof google.maps === 'object') {
                this.resolve();
            }

            const now = new Date().getMilliseconds().toString();
            this.callbackname = "loadGoogleMaps_" + now;

            const params = {
                "key": this.apikey,
                "callback": this.callbackname
            };

            window[this.callbackname] = () => {
                this.resolve();
                setTimeout(function () {
                    try {
                        delete window[this.callbackName];
                    } catch (e) { }
                }, 20);
            };

            let filename = "http://maps.google.com/maps/api/js";
            filename += "?key=" + this.apikey;
            filename += "&callback=" + this.callbackname;
            filename += "&libraries=places";
            filename += "&region=GB";
            filename += "&language=en-GB";
            var fileref = document.createElement('script');
            fileref.setAttribute("type", "text/javascript");
            fileref.setAttribute("src", filename);
            document.body.appendChild(fileref);

            this.apiLoaderPromise = this.deferred.promise;
            return this.apiLoaderPromise;
        }

        public getMap(id: string): google.maps.Map {
            return new google.maps.Map(document.getElementById(id), {
                center: { lat: 51.055605, lng: 3.711732 },
                zoom: 10
            });
        }

        public addMarker(place: google.maps.places.PlaceResult, targetMap: google.maps.Map, markerType: MarkerType, photo = false): google.maps.Marker {
            if (!photo || !place.photos) {
                return new google.maps.Marker({
                    map: targetMap,
                    position: place.geometry.location,
                    title: place.name,
                    icon: this.getIconUrlForMarkerType(markerType)
                });
            }

            return new google.maps.Marker({
                map: targetMap,
                position: place.geometry.location,
                title: place.name,
                icon: place.photos[0].getUrl({ 'maxWidth': 150, 'maxHeight': 150 })
            });
        }

        private getIconUrlForMarkerType(markerType: MarkerType, fallBack = MarkerType.poi): string {
            let icon = this.icons[MarkerType[markerType]];
            if (!icon)
                icon = this.icons[MarkerType[fallBack]];
            return icon;
        }
    }
}