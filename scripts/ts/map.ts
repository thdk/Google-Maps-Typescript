namespace thdk.maps {
    export interface IMap {

    }

    export interface IMarkerOptions {
        markerColor?: string;
        markerType: MarkerType;
    }

    export enum MarkerType {
        castle = 0,
        poi,
        church,
        monument,
        synagogue,
        park,
        museum,
        photo,
        historical
    }

    export class GoogleMapService {
        private apiLoaderPromise: Promise<boolean>;
        private deferred: Deferred<boolean>;
        private apikey: string;
        private callbackname: string;
        private icons: string[];
        public infowindow: google.maps.InfoWindow;

        constructor(apiKey: string) {
            this.apikey = apiKey;
            this.setIcons();
        }

        private resolve() {
            this.deferred.resolve(typeof google === 'object' && typeof google.maps === 'object' ? google.maps : false);
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

                // use a global infowindow to allow only one open infowindow at a time.
                this.infowindow = new google.maps.InfoWindow();

                // remove the api loaded callback function
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
                zoom: 12
            });
        }

        public addMarker(place: google.maps.places.PlaceResult, targetMap: google.maps.Map, options: IMarkerOptions): google.maps.Marker {
            return new google.maps.Marker({
                map: targetMap,
                position: place.geometry.location,
                title: place.name,
                icon: this.getIconUrlForMarkerType(options)
            });
        }

        private setIcons() {
            const iconBase = 'https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container_4x.png,icons/onion/';
            this.icons = new Array();
            this.icons[MarkerType.castle] = iconBase + '1598-historic-building_4x.png';
            this.icons[MarkerType.poi] = iconBase + '1611-japanese-poi_4x.png';
            this.icons[MarkerType.museum] = iconBase + '1636-museum_4x.png';
            this.icons[MarkerType.church] = iconBase + '1670-religious-christian_4x.png';
            this.icons[MarkerType.park] = iconBase + '1720-tree_4x.png';
            this.icons[MarkerType.monument] = iconBase + '1599-historic-monument_4x.png';
            this.icons[MarkerType.photo] = iconBase + '1535-camera-photo_4x.png';
            this.icons[MarkerType.historical] = iconBase + '1598-historic-building_4x.png';
        }

        public getIconUrlForMarkerType(options: IMarkerOptions, scale: number = 1, fallBack = MarkerType.poi): string {
            let icon = this.icons[options.markerType];
            if (!icon)
                icon = this.icons[fallBack];

            icon += "?scale=" + scale.toString();

            if (options.markerColor)
                icon += "&highlight=" + options.markerColor;

            return icon;
        }
    }
}