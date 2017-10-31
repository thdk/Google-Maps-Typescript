namespace shutterstock {
    export namespace images {
        export type ImageSearchResults = {
            data: Image[];
            spellcheck_info?: any;
            page?: number;
            per_page?: number;
            total_count: number;
            search_id: string;
            message?: string;
        }

        export type Image = {
            id: string;
            description?: string;
            added_date?: string;
            media_type: string;
            contributor: Contributor;
            aspect?: number;
            image_type?: string;
            is_editorial?: boolean;
            is_adult?: boolean;
            is_illustration?: boolean;
            has_model_release?: boolean;
            has_property_release?: boolean;
            releases?: string[];
            model_releases?: ModelRelease[];
            categories?: Category[];
            keywords?: string[];
            assets?: ImageAssets;
            models?: Model[];
        }
        export type Contributor = {
            id: string;
        }
        export type ModelRelease = {
            id?: string;
        }
        export type Category = {
            id?: string;
            name?: string;
        }
        export type ImageAssets = {
            small_jpg?: ImageSizeDetails;
            medium_jpg?: ImageSizeDetails;
            huge_jpg?: ImageSizeDetails;
            supersize_jpg?: ImageSizeDetails;
            huge_tiff?: ImageSizeDetails;
            supersize_tiff?: ImageSizeDetails;
            vector_eps?: ImageSizeDetails;
            small_thumb?: Thumbnail;
            large_thumb?: Thumbnail;
            preview?: Thumbnail;
            preview_1000?: Thumbnail;
            preview_1500?: Thumbnail;
        }
        export type ImageSizeDetails = {
            height?: number;
            width?: number;
            file_size?: number;
            display_name?: string;
            dpi?: number;
            format?: string;
            is_licensable?: boolean;
        }
        export type Thumbnail = {
            url: string;
            height: number;
            width: number;
        }
        export type Model = {
            id: string;
        }
    }

    export namespace oauth {
        export interface IShutterStockAuthorizationRequest extends thdk.oauth.IAuthorizationCodeRequest {
            realm?: "customer" | "contributor";
        }

        export interface IShutterStockAccessTokenRequest extends thdk.oauth.IAccessTokenRequest {
            realm?: "customer" | "contributor";
            client_secret: string;
        }
    }
}