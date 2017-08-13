namespace thdk.stock {
    export interface IStock {
        find(keyword: string): any;
    }

    export interface IStockDepencies {
        network: Network,
        clientId: string,
        clientSecret: string
    }

    export class ShutterStock implements IStock {
        private network: Network;

        constructor(deps: IStockDepencies) {
            this.network = deps.network;            
        }

        public find(keyword: string): any {
            // https://${client_id}:${client_secret}@api.shutterstock.com/v2/images/search?query=donkey
            const clientId = "756b7-ed7a5-06b8a-6b80f-0a052-78ed0";
            const clientSecret = "2e1ac-344bb-3b6b8-ed1c2-6d983-57555";
            keyword = encodeURI(keyword);
            const url = "https://" + clientId + ":" + clientSecret + "@api.shutterstock.com/v2/images/search?query=" + keyword;
            return this.network.getAsync(url, 'Basic ' + window.btoa(clientId + ':' + clientSecret))
            .then(data => {
                console.log(data);
                console.log(data.data[0].assets.preview.url);
                return data;
                
            },
            fail => {

            }
            );

        }
    }
}