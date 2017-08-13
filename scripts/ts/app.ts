namespace thdk.stockarto {
    declare const $: any;
    declare const loadGoogleMaps: any;
    declare const config: IAppConfig;

    export interface IAppConfig {
        googleapikey:string;
    }

    export class App {
        private shutterstock: stock.ShutterStock;
        public start(): void {
            const network = new Network();
            const ssDeps: stock.IStockDepencies =  {
                network: network,
                clientId: "",
                clientSecret: ""
            };
            this.shutterstock = new stock.ShutterStock(ssDeps);
             const q = $('query').val();
             this.shutterstock.find("donkey").then(data => {
                 const container = document.getElementById("imagecontainer");
                 const imagedata = data.data[1].assets.preview;
                 var img=document.createElement('img');
                 img.setAttribute("type","text/javascript");
                 img.setAttribute("src", imagedata.url);
                 img.setAttribute("height", imagedata.height);
                 img.setAttribute("width", imagedata.width);
                container.appendChild(img);

             })
            this.initMap();
        }          
         
        //  Network.postAsync("http://httpbin.org/post",true)
        //  .then((data) => {
        //      console.log(data);
        //  });
        

        private initMap(): void {
            const mapservice = new googlemaps.GoogleMapService(config.googleapikey);
            mapservice.loadApiAsync().then(success => {
                const map = mapservice.getMap("sa-map");
            },
            failure => {
                console.log("false"); 
            });
        }
    }

    const stockartoApp = new App();
    stockartoApp.start();
}
