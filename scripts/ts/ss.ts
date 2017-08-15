namespace thdk.stock {
    export interface IStock {
        findAsync(keyword: string): any;
    }

    export interface IStockDepencies {
        network: Network,
        clientId: string,
        clientSecret: string
    }

    export class ShutterStock implements IStock {
        private network: Network;
        private clientId: string;
        private clientSecret: string;

        constructor(deps: IStockDepencies) {
            this.network = deps.network;
            this.clientId = deps.clientId;
            this.clientSecret = deps.clientSecret;       
        }

        public findAsync(keyword: string): Promise<shutterstock.ImageSearchResults> {
            // https://${client_id}:${client_secret}@api.shutterstock.com/v2/images/search?query=donkey           
            keyword = encodeURI(keyword);
            const url = "https://" + this.clientId + ":" + this.clientSecret + "@api.shutterstock.com/v2/images/search?query=" + keyword;
            return this.network.getAsync<shutterstock.ImageSearchResults>(url, 'Basic ' + window.btoa(this.clientId + ':' + this.clientSecret));

        }
    }
}