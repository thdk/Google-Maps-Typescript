namespace thdk {
    export type Falsy = null | undefined | 0 | "" | false;

    export interface IStringKeyValue<T> {
        [index: string]: T;
    }    
}

namespace thdk.utils {
    export function findFirst<T>(arr: T[], predicate: (element: T, i: number, arr: T[]) => boolean): T | Falsy {
        let result: T | Falsy;
        arr.some(function (el, i) {
            return predicate(el, i, arr) ? ((result = el), true) : false;
        });
        return result;
    }

    export function findIndex<T>(arr: T[], predicate: (element: T, i: number, arr: T[]) => boolean): number {
        let index = -1;
        arr.some(function (el, i) {
            return predicate(el, i, arr) ? ((index = i), true) : false;
        });
        return index;
    }

    export function anyMatchInArray(target: string[], toMatch: string[]): boolean {
        var found, targetMap, i, j, cur;

        found = false;
        targetMap = {};

        // Put all values in the `target` array into a map, where
        //  the keys are the values from the array
        for (i = 0, j = target.length; i < j; i++) {
            cur = target[i];
            targetMap[cur] = true;
        }

        // Loop over all items in the `toMatch` array and see if any of
        //  their values are in the map from before
        for (i = 0, j = toMatch.length; !found && (i < j); i++) {
            cur = toMatch[i];
            found = !!targetMap[cur];
            // If found, `targetMap[cur]` will return true, otherwise it
            //  will return `undefined`...that's what the `!!` is for
        }

        return found;
    };
}

namespace thdk {
    export class Network {
        public postAsync(url: string, data: any): Promise<{}> {
            return new Promise<{}>((resolve, reject) => {
                // construct an HTTP request
                var xhr = new XMLHttpRequest();
                xhr.open("POST", url, true);
                xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

                // send the collected data as JSON
                xhr.send(JSON.stringify(data));

                xhr.onloadend = function (data) {
                    resolve(JSON.parse(xhr.responseText));
                };
            });
        }

        public getAsync<T>(url: string, auth: string): Promise<T> {
            return new Promise<T>((resolve, reject) => {
                // construct an HTTP request
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.setRequestHeader('Authorization', auth);
                xhr.send();

                xhr.onloadend = function (data) {
                    resolve(JSON.parse(xhr.responseText));
                };
            });
        }
    }
}