declare const ShutterstockOAuth: any;

namespace thdk.oauth {
    export enum GrantType {
        AuthorizationCode,
        Implicit,
        ResourceOwnerPasswordCredentials,
        ClientCredentials
    }

    export type OAuthProperties = {
        authorizationEndpoint: string;
        tokenEndpoint: string;
        clientId: string;
        clientSecret: string;
        redirectUri: string;
    }

    export interface IAuthorizationCodeRequest {
        client_id: string;
        redirect_uri?: string;
        response_type: string;
        scope?: string;
        state?: string;
    }

    export interface IOath {
        readonly authorizationEndpoint: string;
        readonly tokenEndpoint: string;
        readonly clientId: string;
        readonly clientSecret: string;
        readonly redirectUri: string;
        accessToken: string;
        authorizeAsync(scope: string, state: string): Promise<string>;
    }
}

namespace thdk.stock {
    export interface IStock {
        findAsync(keyword: string): any;
    }

    export interface IStockDepencies {
        network: Network,
        oauth: oauth.IOath;
    }

    export class ShutterStockOauth implements oauth.IOath {
        private network: INetwork;

        public readonly clientId: string;
        public readonly clientSecret: string;
        public readonly authorizationEndpoint: string;
        public readonly tokenEndpoint: string;
        public readonly redirectUri: string;

        public accessToken: string;

        constructor(network: INetwork, props: oauth.OAuthProperties) {
            this.network = network;

            this.clientId = props.clientId;
            this.clientSecret = props.clientSecret;
            this.authorizationEndpoint = props.authorizationEndpoint;
            this.tokenEndpoint = props.tokenEndpoint;
            this.authorizationEndpoint = props.authorizationEndpoint;
            this.redirectUri = [location.protocol, '//', location.host, location.pathname].join('') + props.redirectUri;
        }

        public authorizeAsync(scope: string, state: string): Promise<string> {

            const params: thdk.oauth.IAuthorizationCodeRequest = {
                client_id: this.clientId,
                redirect_uri: this.redirectUri,
                response_type: "code",
                scope,
                state
            };
            const authorizeUri = thdk.utils.addQueryStringParams(this.authorizationEndpoint, params);

            const authorizeWindow = window.open(authorizeUri);

            return new Promise<string>((resolve, reject) => {
                window["oauth2AccessTokenCallback"] = (success: boolean, token: string, msg?: string) => {
                    // remove the api loaded callback function
                    setTimeout(function () {
                        try {
                            delete window["oauth2AccessTokenCallback"];
                        } catch (e) { }
                    }, 20);

                    if (success) {
                        this.accessToken = token;
                        resolve(token);
                    }
                    else {
                        this.accessToken = "";
                        reject(msg);
                    }
                    authorizeWindow.close();
                };
            });
        }
    }

    export class ShutterStock implements IStock {
        private network: Network;
        private oauth: oauth.IOath;

        constructor(deps: IStockDepencies) {
            this.network = deps.network;
            this.oauth = deps.oauth;
        }

        public findAsync(keyword: string): Promise<shutterstock.images.ImageSearchResults> {
            // https://${client_id}:${client_secret}@api.shutterstock.com/v2/images/search?query=donkey           
            keyword = encodeURI(keyword);
            const url = "https://" + this.oauth.clientId + ":" + this.oauth.clientSecret + "@api.shutterstock.com/v2/images/search";
            return this.network.getAsync<shutterstock.images.ImageSearchResults>(url, { query: keyword }, 'Basic ' + window.btoa(this.oauth.clientId + ':' + this.oauth.clientSecret));

        }

        public authorizeAsync() {
            this.oauth.authorizeAsync("user.email", "azerty").then(token => {
                console.log(token);
            })
        }
    }
}