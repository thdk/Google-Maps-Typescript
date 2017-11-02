declare const ShutterstockOAuth: any;

namespace thdk.oauth {
    export enum GrantType {
        AuthorizationCode,
        Implicit,
        ResourceOwnerPasswordCredentials,
        ClientCredentials
    }

    export type AccessTokenResponse = {
        accessToken: string;
        tokenType: string;
        expiresIn?: number;
        refreshToken?: string;
        scope?: string;
        error?: "invalid_request" | "invalid_client" | "invalid_grant" | "unauthorized_client" | "unsupported_grant_type" | "invalid_scope";
        errorDescription?: string;
        errorUri?: string;
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

    export interface IAccessTokenRequest {
        client_id: string;
        client_secret: string;
        code: string;
        grant_type: "authorization_code";
        redirect_uri?: string;
    }

    export interface IAccessTokenResponse {
        access_token: string;
        token_type: string;
        expires_in?: number;
        refresh_token?: string;
        scope?: string;
    }

    export interface IOath {
        readonly authorizationEndpoint: string;
        readonly tokenEndpoint: string;
        readonly clientId: string;
        readonly clientSecret: string;
        readonly redirectUri: string;
        authorizeAsync(scope: string, state: string): Promise<string>;
        getAccessTokenAsync(grantType: "authorization_code", code: string, redirectUrl: string, clientId: string): Promise<AccessTokenResponse>;
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

        constructor(network: INetwork, props: oauth.OAuthProperties) {
            this.network = network;

            this.clientId = props.clientId;
            this.clientSecret = props.clientSecret;
            this.authorizationEndpoint = props.authorizationEndpoint;
            this.tokenEndpoint = props.tokenEndpoint;
            this.authorizationEndpoint = props.authorizationEndpoint;
            this.redirectUri = props.redirectUri;
        }   
        
        public authorizeAsync(scope: string, state: string): Promise<string> {
            
            const params: shutterstock.oauth.IShutterStockAuthorizationRequest = {
                client_id: this.clientId,
                realm: "customer",
                redirect_uri: this.redirectUri,
                response_type: "code",
                scope,
                state
            };
            const authorizeUri = thdk.utils.addQueryStringParams(this.authorizationEndpoint, params);
            
            const authorizeWindow = window.open(authorizeUri);

            return new Promise<string>((resolve, reject) => {

            });
        }

        public getAccessTokenAsync(grantType: "authorization_code", code: string, redirectUrl: string, clientId: string): Promise<oauth.AccessTokenResponse> {
            const params: shutterstock.oauth.IShutterStockAccessTokenRequest = {
                client_id: clientId,
                client_secret: this.clientSecret,
                code,
                grant_type: grantType
            };

            return this.network.postAsync<oauth.IAccessTokenResponse>(this.tokenEndpoint, params).then(response => {
                console.log(response);
                const parsedResponse: oauth.AccessTokenResponse = {
                    accessToken: response.access_token,
                    tokenType: response.token_type
                };
                return parsedResponse;
            })
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

            //build the oauth object
            var options = {
                client_id: this.oauth.clientId,
                scope: "user.email",
                redirect_endpoint: "oauth/redirect.html",
                success: (data) => {
                    console.log(data.code);
                    this.oauth.getAccessTokenAsync("authorization_code", data.code, this.oauth.redirectUri, this.oauth.clientId).then(resp => {
                        console.log(resp);
                        if (resp.error) {
                            // reject
                        }
                        else {
                            console.log(resp.accessToken);
                        }
                    });
                }
            };
           //  var oauth = new ShutterstockOAuth(options);
           //  oauth.authorize();
           this.oauth.authorizeAsync("user.email", "azerty");
        }
    }
}